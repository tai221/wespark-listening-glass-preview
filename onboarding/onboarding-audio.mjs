import { effectSettings } from '../ui-sound.mjs';

export const PROMPTS = Object.freeze({
  skills: "Hi, I'm Spark. Which skills would you like to work on?",
  'picked-listening': "Listening it is. Let's find a good place to start.",
  'picked-speaking': "Speaking it is. We'll work on making your ideas clear.",
  'picked-both': "Both it is. We'll find a balance that fits your time.",
  goals: "What IELTS score are you aiming for? It's okay if you're not sure yet.",
  availability: "How much time can you make for learning? Let's find a pace that works for you.",
  preferences: "What topics do you enjoy?",
  'test-listening': "Let's find your starting point in listening. You can take a short test, or do it later.",
  'test-speaking': "Let's find your starting point in speaking. You can take a short test, or do it later.",
  'questions-listening': "What feels challenging when you listen? Choose any that sound like you, or leave them blank.",
  'questions-speaking': "What would you like to improve when you speak? You can choose more than one, or leave this blank.",
  'questions-both': "Tell me what feels challenging in listening, and what you'd like to improve in speaking. You can leave these blank.",
  summary: "Here's what you've shared. Take a look, and change anything before we get started.",
  results: "Here's what we know so far. We'll keep what we don't know clear.",
});

/** Original local Spark speech. UI integration owns when prompts change. */
export function createOnboardingAudio(document) {
  const settings = effectSettings(document);
  const listeners = new Set();
  let promptKey = null, speaking = false, speech = null, click = null;
  const snapshot = () => ({ enabled: settings.enabled, speaking, promptKey });
  function emit() {
    for (const listener of listeners) {
      try { listener(snapshot()); } catch { /* A UI subscriber cannot block audio cleanup. */ }
    }
  }
  function setSpeaking(value) {
    if (speaking !== value) { speaking = value; emit(); }
  }
  function cancel(kind) {
    const session = kind === 'speech' ? speech : click;
    if (kind === 'speech') speech = null; else click = null;
    if (session) {
      session.finish(false);
      try { session.audio.pause(); session.audio.currentTime = 0; } catch {}
      // Fresh media per attempt keeps late events/promises isolated from replay.
      try { session.audio.removeAttribute('src'); session.audio.load(); session.audio.remove(); } catch {}
    }
    if (kind === 'speech') setSpeaking(false);
  }
  function stop() { cancel('speech'); cancel('click'); }
  function play(kind, filename) {
    cancel(kind);
    if (!settings.enabled || document.hidden || !filename) return Promise.resolve(false);
    return new Promise(resolve => {
      let settled = false;
      const finish = value => { if (!settled) { settled = true; resolve(value); } };
      try {
        const audio = document.createElement('audio');
        const session = { audio, finish };
        if (kind === 'speech') speech = session; else click = session;
        const current = () => (kind === 'speech' ? speech : click) === session;
        audio.src = new URL(`./onboarding-assets/voice/${filename}.wav`, import.meta.url).href;
        audio.preload = 'auto';
        audio.hidden = true;
        audio.dataset.onboardingAudio = kind;
        audio.volume = kind === 'speech' ? 0.9 : 0.28;
        audio.addEventListener('playing', () => {
          if (!current()) return;
          if (!settings.enabled || document.hidden) { cancel(kind); return; }
          if (kind === 'speech') setSpeaking(true);
          finish(true);
        });
        for (const event of ['ended', 'error', 'pause']) {
          audio.addEventListener(event, () => {
            if (!current()) return;
            if (kind === 'speech') setSpeaking(false);
            finish(false);
          });
        }
        document.body?.append(audio);
        const attempt = audio.play();
        if (!attempt || typeof attempt.then !== 'function') { cancel(kind); return; }
        Promise.resolve(attempt).then(() => {
          finish(current() && settings.enabled && !document.hidden && !audio.paused);
        }, () => { if (current()) cancel(kind); else finish(false); });
      } catch { cancel(kind); finish(false); }
    });
  }
  const playPrompt = () => play('speech', promptKey);
  settings.subscribe(enabled => { if (!enabled) stop(); emit(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  document.defaultView.addEventListener('pagehide', stop);
  return {
    get enabled() { return settings.enabled; },
    setPrompt(key) {
      stop();
      promptKey = Object.hasOwn(PROMPTS, key) ? key : null;
      emit();
      return playPrompt();
    },
    playPrompt,
    playClick: () => play('click', 'click'),
    stop,
    toggle() {
      settings.set(!settings.enabled);
      if (settings.enabled) void playPrompt();
      return settings.enabled;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
  };
}
