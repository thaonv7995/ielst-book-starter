import { AudioTrackInfo } from '../types';
import { AUDIO_TRACKS, getAudioTracksForPage } from '../data/book-structure';

export interface AudioPlayerEvents {
  onTrackChange?: (track: AudioTrackInfo) => void;
  onJumpToPage?: (page: number) => void;
}

export class AudioPlayer {
  private container: HTMLElement;
  private audio: HTMLAudioElement;
  private currentTrack: AudioTrackInfo | null = null;
  private currentTracksForPage: AudioTrackInfo[] = [];
  private isPlaying: boolean = false;
  private events: AudioPlayerEvents;
  private isPageHasAudio: boolean = false;

  constructor(container: HTMLElement, events: AudioPlayerEvents) {
    this.container = container;
    this.events = events;
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.setupAudioListeners();
    this.render();
  }

  /**
   * Called whenever the user turns the page in the book.
   * If the page has an audio track, automatically load and show player.
   * If the page has no audio, automatically hide player to focus on reading!
   */
  public updateForPage(page: number): void {
    const tracks = getAudioTracksForPage(page);
    this.currentTracksForPage = tracks;
    const island = this.container.querySelector('#page-audio-player') as HTMLElement;

    if (tracks.length > 0) {
      this.isPageHasAudio = true;
      if (island) {
        island.classList.add('visible');
      }

      // If current track is already one of the tracks for this page, keep playing it!
      const isCurrentInPage = this.currentTrack && tracks.some((t) => t.id === this.currentTrack!.id);
      if (!isCurrentInPage) {
        this.loadTrack(tracks[0], false);
      } else {
        this.updateTrackInfoUI();
      }
    } else {
      this.isPageHasAudio = false;
      // If user was listening to something and turned page, pause or hide
      if (island) {
        island.classList.remove('visible');
      }
      if (this.isPlaying) {
        this.pause();
      }
    }
  }

  public hasAudioForCurrentPage(): boolean {
    return this.isPageHasAudio;
  }

  public loadTrack(track: AudioTrackInfo, autoPlay: boolean = false): void {
    this.currentTrack = track;
    this.audio.src = `/audio/${track.filename}`;
    this.updateTrackInfoUI();

    if (autoPlay) {
      this.play();
    } else {
      this.pause();
    }
    this.events.onTrackChange?.(track);
  }

  public playTrackById(id: number, autoPlay: boolean = true): void {
    const found = AUDIO_TRACKS.find((t) => t.id === id);
    if (found) {
      const island = this.container.querySelector('#page-audio-player') as HTMLElement;
      if (island) island.classList.add('visible');
      this.loadTrack(found, autoPlay);
    }
  }

  public getCurrentTrack(): AudioTrackInfo | null {
    return this.currentTrack;
  }

  public play(): void {
    this.audio
      .play()
      .then(() => {
        this.isPlaying = true;
        this.updatePlayStateUI();
      })
      .catch((err) => {
        console.warn('Audio play error:', err);
      });
  }

  public pause(): void {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayStateUI();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seekRelative(seconds: number): void {
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || 0, this.audio.currentTime + seconds));
  }

  public setSpeed(speed: number): void {
    this.audio.playbackRate = speed;
    const speedSelect = this.container.querySelector('#player-speed-select') as HTMLSelectElement;
    if (speedSelect) speedSelect.value = String(speed);
  }

  private setupAudioListeners(): void {
    this.audio.addEventListener('timeupdate', () => {
      this.updateTimeUI();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayStateUI();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.updateTimeUI();
    });
  }

  private formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- Sleek Page-Mapped Floating Audio Player (Only shows when page has audio) -->
      <div class="page-audio-capsule" id="page-audio-player">
        <!-- Play / Pause Button -->
        <button class="capsule-play-btn" id="capsule-btn-play" title="Phát bài nghe của trang này">
          <svg class="icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <svg class="icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
        </button>

        <!-- Track Title & Meta -->
        <div class="capsule-info">
          <div class="capsule-track-badges" id="capsule-track-badges">
            <span class="capsule-track-badge" id="capsule-track-badge">Track 02</span>
          </div>
          <!-- Equalizer Live Wave Bars -->
          <div class="capsule-wave-bars" id="capsule-wave-bars">
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
            <span class="wave-bar"></span>
          </div>
          <span class="capsule-track-name" id="capsule-track-name">Unit 1 Listening</span>
        </div>

        <!-- Scrub progress bar -->
        <div class="capsule-seek-wrapper" id="capsule-seek-wrapper">
          <div class="capsule-seek-track">
            <div class="capsule-seek-fill" id="capsule-seek-fill"></div>
          </div>
        </div>

        <!-- Time -->
        <div class="capsule-time">
          <span id="capsule-time-cur">00:00</span> / <span id="capsule-time-dur">00:00</span>
        </div>

        <!-- Secondary Controls -->
        <div class="capsule-actions">
          <button class="capsule-btn" id="capsule-skip-prev" title="Lùi 5s">−5s</button>
          <button class="capsule-btn" id="capsule-skip-next" title="Tua 5s">+5s</button>
          <select id="player-speed-select" class="capsule-speed-select" title="Tốc độ">
            <option value="0.75">0.75x</option>
            <option value="0.85">0.85x</option>
            <option value="1.0" selected>1.0x</option>
            <option value="1.25">1.25x</option>
          </select>
        </div>
      </div>
    `;

    this.wireEvents();
  }

  private wireEvents(): void {
    const btnPlay = this.container.querySelector('#capsule-btn-play');
    const btnPrev = this.container.querySelector('#capsule-skip-prev');
    const btnNext = this.container.querySelector('#capsule-skip-next');
    const seekBar = this.container.querySelector('#capsule-seek-wrapper');
    const speedSelect = this.container.querySelector('#player-speed-select') as HTMLSelectElement;

    btnPlay?.addEventListener('click', () => this.togglePlay());
    btnPrev?.addEventListener('click', () => this.seekRelative(-5));
    btnNext?.addEventListener('click', () => this.seekRelative(5));

    speedSelect?.addEventListener('change', (e) => {
      this.setSpeed(parseFloat((e.target as HTMLSelectElement).value));
    });

    seekBar?.addEventListener('click', (e: any) => {
      const rect = seekBar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (this.audio.duration) {
        this.audio.currentTime = pos * this.audio.duration;
      }
    });
  }

  private updateTrackInfoUI(): void {
    if (!this.currentTrack) return;
    const badgesContainer = this.container.querySelector('#capsule-track-badges');
    const name = this.container.querySelector('#capsule-track-name');

    if (badgesContainer) {
      if (this.currentTracksForPage.length > 1) {
        badgesContainer.innerHTML = this.currentTracksForPage
          .map(
            (t) => `
            <button class="capsule-track-tab ${t.id === this.currentTrack?.id ? 'active' : ''}" data-track-id="${t.id}" title="${t.title}: ${t.subtitle}">
              ${t.title}
            </button>
          `
          )
          .join('');

        badgesContainer.querySelectorAll('.capsule-track-tab').forEach((tab) => {
          tab.addEventListener('click', (e) => {
            const trackId = parseInt((e.currentTarget as HTMLElement).getAttribute('data-track-id') || '0', 10);
            const found = this.currentTracksForPage.find((t) => t.id === trackId);
            if (found && found.id !== this.currentTrack?.id) {
              this.loadTrack(found, true);
            }
          });
        });
      } else {
        badgesContainer.innerHTML = `<span class="capsule-track-badge" id="capsule-track-badge">🎧 ${this.currentTrack.title}</span>`;
      }
    }

    if (name) {
      name.textContent = this.currentTrack.subtitle;
      (name as HTMLElement).title = `${this.currentTrack.title}: ${this.currentTrack.subtitle}`;
    }
  }

  private updatePlayStateUI(): void {
    const island = this.container.querySelector('#page-audio-player') as HTMLElement;
    const btnPlay = this.container.querySelector('#capsule-btn-play') as HTMLElement;
    const iconPlay = this.container.querySelector('.icon-play') as HTMLElement;
    const iconPause = this.container.querySelector('.icon-pause') as HTMLElement;
    if (island) island.classList.toggle('is-playing', this.isPlaying);
    if (btnPlay) btnPlay.classList.toggle('active', this.isPlaying);
    if (iconPlay && iconPause) {
      iconPlay.style.display = this.isPlaying ? 'none' : 'block';
      iconPause.style.display = this.isPlaying ? 'block' : 'none';
    }
  }

  private updateTimeUI(): void {
    const curTimeLabel = this.container.querySelector('#capsule-time-cur');
    const durLabel = this.container.querySelector('#capsule-time-dur');
    const seekFill = this.container.querySelector('#capsule-seek-fill') as HTMLElement;

    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;

    if (curTimeLabel) curTimeLabel.textContent = this.formatTime(cur);
    if (durLabel) durLabel.textContent = this.formatTime(dur);

    if (seekFill && dur > 0) {
      seekFill.style.width = `${(cur / dur) * 100}%`;
    }
  }
}
