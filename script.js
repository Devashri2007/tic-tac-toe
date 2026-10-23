(() => {
  const $ = id => document.getElementById(id);
  const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  let mode = 'pvp', diff = 'easy';
  let names = { X: 'Player 1', O: 'Player 2' };
  let scores = { X: 0, O: 0, D: 0 };
  let board, turn, over, startX = true;

  // ---------- Setup screen ----------
  document.querySelectorAll('.mode').forEach(b => b.onclick = () => {
    document.querySelectorAll('.mode').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    mode = b.dataset.mode;
    const ai = mode === 'ai';
    $('p2Field').hidden = ai;
    $('p2').required = !ai;
    $('diffField').hidden = !ai;
  });
  document.querySelectorAll('.diff').forEach(b => b.onclick = () => {
    document.querySelectorAll('.diff').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    diff = b.dataset.diff;
  });

  $('setupForm').onsubmit = e => {
    e.preventDefault();
    names.X = $('p1').value.trim() || 'Player 1';
    names.O = mode === 'ai' ? 'Computer' : ($('p2').value.trim() || 'Player 2');
    scores = { X: 0, O: 0, D: 0 };
    startX = true;
    $('nameX').textContent = names.X + ' (X)';
    $('nameO').textContent = names.O + ' (O)';
    show('game');
    newRound();
  };
  $('menu').onclick = () => show('setup');
  $('again').onclick = newRound;

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  // ---------- Game ----------
  function newRound() {
    board = Array(9).fill('');
    over = false;
    turn = startX ? 'X' : 'O';
    startX = !startX;                       // alternate who starts
    $('lineEl').classList.remove('show');
    const el = $('board');
    el.innerHTML = '';
    board.forEach((_, i) => {
      const c = document.createElement('button');
      c.className = 'cell';
      c.setAttribute('aria-label', 'Cell ' + (i + 1));
      c.onclick = () => humanMove(i);
      el.appendChild(c);
    });
    refresh();
    if (isAI(turn)) aiTurn();
  }

  const isAI = p => mode === 'ai' && p === 'O';

  function humanMove(i) {
    if (over || board[i] || isAI(turn)) return;
    place(i);
    if (!over && isAI(turn)) aiTurn();
  }

  function place(i) {
    board[i] = turn;
    const c = $('board').children[i];
    c.textContent = turn;
    c.classList.add(turn.toLowerCase(), 'pop');
    c.disabled = true;

    const win = winner(board);
    if (win) return end(win.player, win.line);
    if (board.every(Boolean)) return end('D');
    turn = turn === 'X' ? 'O' : 'X';
    refresh();
  }

  function end(player, line) {
    over = true;
    scores[player]++;
    $('scoreX').textContent = scores.X;
    $('scoreO').textContent = scores.O;
    $('scoreD').textContent = scores.D;
    [...$('board').children].forEach(c => c.disabled = true);
    if (player === 'D') {
      $('status').textContent = "It's a draw!";
    } else {
      $('status').textContent = `🎉 ${names[player]} wins!`;
      line.forEach(i => $('board').children[i].classList.add('win'));
      drawLine(line);
    }
    $('sx').classList.remove('turn'); $('so').classList.remove('turn');
  }

  function refresh() {
    $('status').textContent = `${names[turn]}'s turn (${turn})`;
    $('sx').classList.toggle('turn', turn === 'X');
    $('so').classList.toggle('turn', turn === 'O');
  }

  function drawLine(line) {
    const pt = i => [(i % 3) * 100 + 50, Math.floor(i / 3) * 100 + 50];
    const [x1, y1] = pt(line[0]), [x2, y2] = pt(line[2]);
    const l = $('lineEl');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.classList.remove('show'); void l.getBoundingClientRect(); l.classList.add('show');
  }

  function winner(b) {
    for (const line of WINS) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
    }
    return null;
  }

  // ---------- AI ----------
  function aiTurn() {
    $('status').textContent = 'Computer is thinking…';
    setTimeout(() => {
      if (over) return;
      const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
      let move;
      if (diff === 'easy') {
        // Easy: sometimes smart (win/block), otherwise random
        move = Math.random() < 0.35 ? bestMove() : empty[Math.floor(Math.random() * empty.length)];
      } else {
        move = bestMove();
      }
      place(move);
    }, 550);
  }

  function bestMove() {
    let best = -Infinity, move = null;
    board.forEach((v, i) => {
      if (v) return;
      board[i] = 'O';
      const s = minimax(board, false, 0);
      board[i] = '';
      if (s > best) { best = s; move = i; }
    });
    return move;
  }

  function minimax(b, isMax, depth) {
    const w = winner(b);
    if (w) return w.player === 'O' ? 10 - depth : depth - 10;
    if (b.every(Boolean)) return 0;
    let best = isMax ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = isMax ? 'O' : 'X';
      const s = minimax(b, !isMax, depth + 1);
      b[i] = '';
      best = isMax ? Math.max(best, s) : Math.min(best, s);
    }
    return best;
  }
})();
