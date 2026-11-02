export function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Tom suave e agradável de notificação (880Hz descendo suavemente para 587Hz)
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    // Silencia erros se o navegador bloquear autoplay
  }
}

export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {}
  }
}

export function notifyMessage(title: string, body: string, onClick?: () => void) {
  playChime();

  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/vite.svg',
        silent: true // Já tocamos o chime via Web Audio API
      });

      notif.onclick = () => {
        window.focus();
        if (onClick) onClick();
        notif.close();
      };
    } catch (err) {
      console.warn('Erro ao disparar notificação nativa:', err);
    }
  }
}

