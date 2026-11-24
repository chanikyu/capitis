// Capitis 미팅 손님 페이지(사용자 요청 2026-11-24): 이름을 적고 들어가 앱의 회의 화면과 같은 모양(어두운 무대 + 아래 조작 줄)으로 —
// 마이크·카메라 켜기/끄기(꺼지면 빨강), 화면 공유, 나가기. 파일 공유·초대는 앱 회원만(사용자 결정 '회원 + 앱 없는 사람은 링크로 참여').
// 입장권은 기능 담당의 서버 함수(JOIN_URL)에서 { code, name, password? } → { url, token, title }. 거절·끊김은 받은 글 그대로 보인다(사용자 결정 'LiveKit 무료 상한만').
// 2026-11-24: 링크에 아이디가 없으면 아이디 칸(아이디·링크를 붙여 넣어도 됨), 비공개 회의면 비밀번호 칸(서버가 needsPassword 로 답할 때), 누가 녹화하면 '녹화 중 · 누가'.
// LiveKit: 같은 폴더의 livekit-client.umd.js 2.24.1(Apache-2.0, 앱 ui/vendor 와 같은 파일).
(function () {
  'use strict';

  // 서버 함수 meeting-guest(기능 담당 2026-11-24): https://chanikyu.github.io 에서 오는 부름만 받는다(CORS). 거절은 { error: 사람이 읽는 글 }.
  const JOIN_URL = 'https://gvumqixbeqqaivpecnms.supabase.co/functions/v1/meeting-guest';
  const JOIN_HEADERS = { apikey: 'sb_publishable_nl_mPKPjDb6XBlAxvQfLbw_Ia3f8hTa' }; // 공개 열쇠(비밀 아님 — 앱 config.rs SUPABASE_PUBLISHABLE_KEY 와 같은 값)
  const CLOCK_MS = 1000;
  const LANG_KEY = 'capitis.meet.lang'; // 고른 말(이 브라우저에만)
  const TEXT = {
    ko: {
      title: '회의에 참여하기', name: '이름', code: '회의 아이디', codePlaceholder: 'abc-defg-hij 또는 받은 링크', password: '회의 비밀번호', needCode: '회의 아이디를 넣으세요.', needPassword: '비공개 회의입니다. 회의 비밀번호를 넣으세요.', recording: '녹화 중', namePlaceholder: '다른 참가자에게 보일 이름', join: '참여하기', again: '다시 참여하기', controls: '회의 조작',
      note: '카메라와 마이크는 들어간 뒤 켜고 끌 수 있습니다. 말한 내용은 회의록을 만들려고 주최자 쪽 Capitis 에서 글로 바뀝니다.',
      needName: '이름을 적으세요.', joining: '들어가는 중…',
      joinFailed: '회의에 들어가지 못했습니다: ', connectFailed: '회의에 연결하지 못했습니다: ', reconnecting: '연결이 끊겨 다시 잇는 중…',
      mic: '마이크', micOff: '마이크 꺼짐', cam: '카메라', camOff: '카메라 꺼짐', screen: '화면 공유', stopScreen: '공유 멈추기', leave: '나가기',
      micFailed: '마이크를 켜지 못했습니다: ', camFailed: '카메라를 켜지 못했습니다: ', screenFailed: '화면을 공유하지 못했습니다: ',
      denied: '권한이 없습니다. 브라우저 주소 줄 옆의 권한 설정에서 허용하세요.', noScreen: '이 브라우저에서는 화면 공유를 쓸 수 없습니다.',
      me: '나', guest: '손님', screenOf: ' 님의 화면', noName: '이름 없음',
      leftTitle: '회의에서 나왔습니다', leftText: '창을 닫아도 됩니다.', endedTitle: '회의가 끝났습니다', endedText: '주최자가 회의를 끝냈습니다. 회의록은 주최자의 Capitis 에 남습니다.',
      droppedTitle: '회의 연결이 끊겼습니다', dropped: 'LiveKit: ',
    },
    en: {
      title: 'Join the meeting', name: 'Name', code: 'Meeting ID', codePlaceholder: 'abc-defg-hij or the link you received', password: 'Meeting password', needCode: 'Enter the meeting ID.', needPassword: 'This is a private meeting. Enter the meeting password.', recording: 'Recording', namePlaceholder: 'Name other people will see', join: 'Join', again: 'Join again', controls: 'Meeting controls',
      note: 'You can turn your camera and mic on or off after joining. What you say is transcribed by the host\'s Capitis to write the minutes.',
      needName: 'Enter your name.', joining: 'Joining…',
      joinFailed: 'Couldn\'t join the meeting: ', connectFailed: 'Couldn\'t connect to the meeting: ', reconnecting: 'Connection lost — reconnecting…',
      mic: 'Mic', micOff: 'Mic off', cam: 'Camera', camOff: 'Camera off', screen: 'Share screen', stopScreen: 'Stop sharing', leave: 'Leave',
      micFailed: 'Couldn\'t turn the mic on: ', camFailed: 'Couldn\'t turn the camera on: ', screenFailed: 'Couldn\'t share the screen: ',
      denied: 'Permission denied. Allow it in the site permissions next to the address bar.', noScreen: 'Screen sharing isn\'t available in this browser.',
      me: 'Me', guest: 'Guest', screenOf: '\'s screen', noName: 'No name',
      leftTitle: 'You left the meeting', leftText: 'You can close this window.', endedTitle: 'The meeting has ended', endedText: 'The host ended the meeting. The minutes stay in the host\'s Capitis.',
      droppedTitle: 'The meeting connection dropped', dropped: 'LiveKit: ',
    },
  };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const ICONS = { // 앱 meeting-room.js 와 같은 선 아이콘
    mic: ['M12 3.5a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-5 0V6A2.5 2.5 0 0 1 12 3.5z', 'M6.5 11a5.5 5.5 0 0 0 11 0', 'M12 16.5V20', 'M9 20h6'],
    cam: ['M4 7.5h10a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 15V9A1.5 1.5 0 0 1 4 7.5z', 'M15.5 10.5l5-3v9l-5-3'],
    screen: ['M3.5 5h17v11h-17z', 'M9 20h6', 'M12 16v4', 'M12 13V8', 'M9.5 10.5 12 8l2.5 2.5'],
    leave: ['M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14', 'M10 8l-4 4 4 4', 'M6 12h9'],
    slash: ['M4 4l16 16'],
  };

  const el = id => document.getElementById(id);
  let lang = pickLang();
  const say = key => TEXT[lang][key];
  const linkCode = decodeURIComponent(location.hash.slice(1)); // # 뒤 전부(아이디, 아이디.열쇠, 옛 32자리 — 기능 담당이 알아본다)
  let livekit = null;
  let room = null;
  let leaving = false;
  let clock = null;
  let startedAt = 0;
  const tiles = new Map();

  function pickLang() {
    let saved = '';
    try { saved = localStorage.getItem(LANG_KEY) || ''; } catch (err) { saved = ''; }
    if (saved === 'ko' || saved === 'en') return saved;
    return (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }

  /** 고정 글(data-t)을 고른 말로. */
  function paintText() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach(node => { node.textContent = say(node.dataset.t); });
    document.querySelectorAll('[data-t-placeholder]').forEach(node => { node.placeholder = say(node.dataset.tPlaceholder); });
    document.querySelectorAll('[data-t-label]').forEach(node => node.setAttribute('aria-label', say(node.dataset.tLabel)));
    document.querySelectorAll('[data-lang]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.lang === lang)));
    if (room) paint();
  }

  function node(tag, className, text) {
    const made = document.createElement(tag);
    if (className) made.className = className;
    if (text !== undefined) made.textContent = text;
    return made;
  }
  /** 선 아이콘(off 면 빗금 — 꺼짐). */
  function icon(name, off = false) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', `icon${off ? ' is-off' : ''}`);
    [...ICONS[name], ...(off ? ICONS.slash : [])].forEach(path => {
      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('d', path);
      svg.append(line);
    });
    return svg;
  }
  const status = text => { el('join-status').textContent = text; };
  const note = text => { el('room-note').textContent = text; };
  const reason = err => (err && err.name === 'NotAllowedError' ? say('denied') : String((err && err.message) || err));
  // 손님 표시: metadata 는 참가자가 바꿀 수 있어 믿지 않고 LiveKit identity 꼴로 — 회원은 'm-<회원 id>', 그 밖은 손님(앱 meeting-room.js 와 같은 규칙)
  const isGuest = person => !String(person.identity || '').startsWith('m-');
  const nameOf = person => person.name || person.identity || say('noName');
  const initials = name => ([...name.trim()][0] || '?').toUpperCase();
  const everyone = () => [room.localParticipant, ...room.remoteParticipants.values()];

  function showPassword(on) {
    el('join-password').hidden = !on;
    document.querySelector('label[for="join-password"]').hidden = !on;
  }

  function show(view) {
    el('join').hidden = view !== 'join';
    el('room').hidden = view !== 'room';
    el('bye').hidden = view !== 'bye';
  }

  /** 입장권: 서버 함수가 거절하면 받은 글(message·error 또는 본문) 그대로. */
  async function ticket(code, name, password) {
    const response = await fetch(JOIN_URL, { method: 'POST', headers: { 'content-type': 'application/json', ...JOIN_HEADERS }, body: JSON.stringify({ code, name, ...(password ? { password } : {}) }) });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch (err) { body = null; }
    if (!response.ok) throw Object.assign(new Error((body && (body.error || body.message)) || text || `HTTP ${response.status}`), { needsPassword: Boolean(body && body.needsPassword) }); // 기능 담당 약속: { error, needsPassword? }
    return body;
  }

  /** [참여하기]: 이름 확인 → 입장권 → LiveKit 연결 → 회의 화면, 마이크·카메라 켜기. 거절되면 받은 글 그대로. */
  async function join(event) {
    if (event) event.preventDefault();
    const name = el('join-name').value.trim();
    const typed = el('join-code').value.trim();
    const code = linkCode || (typed.includes('#') ? decodeURIComponent(typed.slice(typed.indexOf('#') + 1)) : typed); // 링크를 붙여 넣어도 # 뒤만
    if (!code) { status(say('needCode')); el('join-code').focus(); return; }
    if (!name) { status(say('needName')); el('join-name').focus(); return; }
    const password = el('join-password').hidden ? '' : el('join-password').value;
    el('join-go').disabled = true;
    status(say('joining'));
    let pass;
    try {
      pass = await ticket(code, name, password);
    } catch (err) {
      el('join-go').disabled = false;
      if (err && err.needsPassword) { // 비공개 회의: 비밀번호 칸을 보이고 서버 글(틀렸으면 틀렸다는 글)을 그대로
        showPassword(true);
        status(password ? String(err.message) : say('needPassword'));
        el('join-password').focus();
        return;
      }
      status(say('joinFailed') + String((err && err.message) || err));
      return;
    }
    livekit = window.LivekitClient;
    room = new livekit.Room({ adaptiveStream: true, dynacast: true });
    bind();
    try {
      await room.connect(pass.url, pass.token);
    } catch (err) {
      room = null;
      el('join-go').disabled = false;
      status(say('connectFailed') + String((err && err.message) || err)); // LiveKit 이 준 글 그대로
      return;
    }
    el('join-go').disabled = false;
    status('');
    el('room-title').textContent = pass.title || '';
    show('room');
    leaving = false;
    startedAt = Date.now();
    clock = setInterval(paintClock, CLOCK_MS);
    paintClock();
    await setMic(true);
    await setCam(true);
  }

  /** 방 사건을 화면에: 사람·트랙이 바뀌면 다시 그리기, 남의 소리 틀기, 끊김(주최자가 끝냄·그 밖). */
  function bind() {
    const events = livekit.RoomEvent;
    [events.ParticipantConnected, events.ParticipantDisconnected, events.TrackSubscribed, events.TrackUnsubscribed, events.TrackMuted, events.TrackUnmuted,
      events.LocalTrackPublished, events.LocalTrackUnpublished, events.ActiveSpeakersChanged, events.ParticipantAttributesChanged].forEach(name => room.on(name, paint));
    room.on(events.TrackSubscribed, track => { if (track.kind === 'audio') el('audio').append(track.attach()); });
    room.on(events.TrackUnsubscribed, track => { if (track.kind === 'audio') track.detach().forEach(media => media.remove()); });
    room.on(events.Reconnecting, () => note(say('reconnecting')));
    room.on(events.Reconnected, () => note(''));
    room.on(events.Disconnected, why => {
      if (leaving || !room) return;
      const ended = why === livekit.DisconnectReason.ROOM_DELETED;
      finish(ended ? 'ended' : 'dropped', livekit.DisconnectReason[why] || String(why));
    });
  }

  function paintClock() {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    el('room-clock').textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  /** 영상 칸과 조작 줄(꺼짐은 빨강·빗금)을 지금 상태로. */
  function paint() {
    if (!room) return;
    paintTiles();
    const local = room.localParticipant;
    control(el('mic'), 'mic', local.isMicrophoneEnabled ? say('mic') : say('micOff'), !local.isMicrophoneEnabled);
    el('mic').setAttribute('aria-pressed', String(Boolean(local.isMicrophoneEnabled)));
    control(el('cam'), 'cam', local.isCameraEnabled ? say('cam') : say('camOff'), !local.isCameraEnabled);
    el('cam').setAttribute('aria-pressed', String(Boolean(local.isCameraEnabled)));
    control(el('screen'), 'screen', local.isScreenShareEnabled ? say('stopScreen') : say('screen'), false);
    el('screen').setAttribute('aria-pressed', String(Boolean(local.isScreenShareEnabled)));
    el('screen').classList.toggle('is-active', Boolean(local.isScreenShareEnabled));
    control(el('leave'), 'leave', say('leave'), false);
    const recorders = everyone().filter(person => (person.attributes || {}).recording === 'yes').map(nameOf); // 회원이 녹화하면 손님에게도 알린다(사용자 결정)
    el('room-recording').textContent = recorders.length ? `${say('recording')} · ${recorders.join(', ')}` : '';
    el('room-recording').hidden = !recorders.length;
  }
  function control(target, name, label, off) {
    target.replaceChildren(icon(name, off), node('span', 'control-label', label));
    target.classList.toggle('is-off', off);
  }

  /** 칸: 화면 공유 먼저(크게), 사람마다 카메라 — 있던 칸은 그대로 두고 바뀐 것만(앱 meeting-room.js 와 같은 규칙). */
  function paintTiles() {
    const wanted = [];
    everyone().forEach(person => {
      const screen = person.getTrackPublication(livekit.Track.Source.ScreenShare);
      if (screen && screen.track) wanted.push({ key: `${person.identity}|screen`, person, pub: screen, screen: true });
      wanted.push({ key: `${person.identity}|camera`, person, pub: person.getTrackPublication(livekit.Track.Source.Camera), screen: false });
    });
    wanted.sort((a, b) => Number(b.screen) - Number(a.screen));
    const keys = new Set(wanted.map(want => want.key));
    // 나간 사람·멈춘 화면 공유의 칸은 떼고 지운다
    [...tiles.keys()].filter(key => !keys.has(key)).forEach(key => { const tile = tiles.get(key); if (tile.track) tile.track.detach(tile.video); tile.box.remove(); tiles.delete(key); });
    const stage = el('stage');
    wanted.forEach((want, index) => {
      let tile = tiles.get(want.key);
      if (!tile) { // 새 칸: 영상(늘 소리 없이 — 소리는 audio 로 따로) · 머리글자 · 이름표
        const box = node('div', `tile${want.screen ? ' is-screen' : ''}`);
        const video = document.createElement('video');
        video.autoplay = true; video.playsInline = true; video.muted = true;
        tile = { box, video, avatar: node('div', 'avatar'), label: node('div', 'tile-label'), track: null };
        box.append(video, tile.avatar, tile.label);
        tiles.set(want.key, tile);
      }
      const track = want.pub && want.pub.track && !want.pub.isMuted ? want.pub.track : null;
      if (tile.track !== track) { // 트랙이 바뀔 때만 다시 붙인다(깜빡이지 않게)
        if (tile.track) tile.track.detach(tile.video); if (track) track.attach(tile.video); tile.track = track; }
      const local = want.person === room.localParticipant;
      const micOff = !want.screen && !want.person.isMicrophoneEnabled;
      tile.box.classList.toggle('is-video-off', !track);
      tile.box.classList.toggle('is-mirror', local && !want.screen);
      tile.box.classList.toggle('is-speaking', !want.screen && Boolean(want.person.isSpeaking));
      tile.avatar.textContent = initials(nameOf(want.person));
      const role = isGuest(want.person) ? ` · ${say('guest')}` : '';
      const label = want.screen ? `${nameOf(want.person)}${say('screenOf')}` : `${nameOf(want.person)}${local ? ` (${say('me')})` : ''}${role}`;
      tile.label.replaceChildren(...(micOff ? [icon('mic', true)] : []), node('span', 'tile-name', label));
      if (stage.children[index] !== tile.box) stage.insertBefore(tile.box, stage.children[index] || null);
    });
    stage.classList.toggle('has-screen', wanted.some(want => want.screen));
    stage.dataset.count = String(wanted.length);
  }

  async function setMic(on) {
    try { await room.localParticipant.setMicrophoneEnabled(on); } catch (err) { note(say('micFailed') + reason(err)); }
    paint();
  }
  async function setCam(on) {
    try { await room.localParticipant.setCameraEnabled(on); } catch (err) { note(say('camFailed') + reason(err)); }
    paint();
  }
  /** [화면 공유]: 켜기·끄기(고르기 창 취소는 조용히). */
  async function toggleScreen() {
    const turnOn = !room.localParticipant.isScreenShareEnabled;
    if (turnOn && !(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) { note(say('noScreen')); return; }
    try { await room.localParticipant.setScreenShareEnabled(turnOn); } catch (err) { if (!err || (err.name !== 'NotAllowedError' && err.name !== 'AbortError')) note(say('screenFailed') + reason(err)); }
    paint();
  }

  async function leave() {
    if (!room) return;
    leaving = true;
    await room.disconnect();
    finish('left');
  }

  /** 회의 화면을 치우고 끝 화면: 나감 · 주최자가 끝냄 · 끊김(LiveKit 까닭 이름 그대로). */
  function finish(kind, why = '') {
    clearInterval(clock);
    tiles.forEach(tile => { if (tile.track) tile.track.detach(tile.video); });
    tiles.clear();
    el('stage').replaceChildren();
    el('audio').replaceChildren();
    room = null;
    note('');
    el('bye-title').textContent = say(kind === 'ended' ? 'endedTitle' : kind === 'dropped' ? 'droppedTitle' : 'leftTitle');
    el('bye-text').textContent = kind === 'ended' ? say('endedText') : kind === 'dropped' ? say('dropped') + why : say('leftText');
    el('bye-again').hidden = kind === 'ended';
    show('bye');
  }

  el('join-form').addEventListener('submit', join);
  el('mic').addEventListener('click', () => setMic(!room.localParticipant.isMicrophoneEnabled));
  el('cam').addEventListener('click', () => setCam(!room.localParticipant.isCameraEnabled));
  el('screen').addEventListener('click', toggleScreen);
  el('leave').addEventListener('click', leave);
  el('bye-again').addEventListener('click', () => show('join'));
  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
    lang = button.dataset.lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (err) { /* 이 브라우저에 못 남겨도 지금 화면은 바뀐다 */ }
    paintText();
  }));
  paintText();
  if (!linkCode) { el('join-code').hidden = false; document.querySelector('label[for="join-code"]').hidden = false; } // 링크에 아이디가 없으면 아이디 칸을
})();
