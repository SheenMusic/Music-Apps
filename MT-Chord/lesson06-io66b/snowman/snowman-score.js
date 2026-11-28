/* 全曲譜面。資料保留記譜拍位；播放 cue 保留 MIDI 的實際 ON/OFF 秒數。 */
(() => {
  'use strict';
  const VF = Vex.Flow;
  const STAFF = {voice: 70, rh: 290, lh: 430};
  const SYSTEM_HEIGHT = 610;
  const MIDI_OFFSET = 4;
  const pitchStep = key => { const [name, octave] = key.split('/'); return Number(octave) * 7 + 'cdefgab'.indexOf(name[0]); };

  function beatTime(data, scoreBeat) {
    const beat = scoreBeat + MIDI_OFFSET;
    let tempo = {beat: 0, time: 0, secondsPerBeat: .5};
    for (const next of data.tempos) { if (next.beat > beat) break; tempo = next; }
    return tempo.time + (beat - tempo.beat) * tempo.secondsPerBeat;
  }

  function mount(host, data, {wrap = false, availableWidth = 1200, onSelect = () => {}} = {}) {
    host.replaceChildren();
    const widths = data.measures.map((m, i) => {
      const staves = Object.values(m.staves);
      const beats = new Set(staves.flatMap(st => st.voices.flatMap(v => v.filter(n => !n.rest).map(n => n.beat))));
      const lyrics = m.staves.voice.voices.flat().filter(n => n.lyric).reduce((sum, n) => sum + Math.max(40, n.lyric.length * 9), 0);
      return Math.max(210, 80 + beats.size * 40, lyrics + 70) + (i === 0 ? 100 : 0);
    });
    const layout = [];
    let row = 0, x = 22;
    for (let mi = 0; mi < widths.length; mi++) {
      if (wrap && x > 22 && x + widths[mi] > availableWidth - 20) { row++; x = 22; }
      const first = x === 22;
      const width = Math.min(widths[mi] + (first && mi ? 90 : 0), wrap ? Math.max(280, availableWidth - 44) : Infinity);
      layout.push({x, y: row * SYSTEM_HEIGHT, width, row, first});
      x += width;
    }
    const width = Math.max(...layout.map(l => l.x + l.width)) + 22;
    const height = (row + 1) * SYSTEM_HEIGHT;
    const renderer = NotationRenderer.createRenderer(host);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    const placed = [], repeats = [], positions = [], ties = [], lyrics = [], ottavas = [];
    const openTies = new Map();
    const visibleRests = [], tieBoxes = [], fermatas = [];
    const measures = [];

    data.measures.forEach((m, mi) => {
      const l = layout[mi], staves = {}, voices = [], clefNotes = [], drawn = [], beams = [], tuplets = [], rests = [], restLines = [], timed = [];
      const formatter = NotationRenderer.createFormatter();
      const clefAt = (name, beat) => {
        const st = m.staves[name];
        return st.clefChanges.filter(c => c.beat <= beat).at(-1)?.clef || st.clef;
      };
      for (const name of ['voice', 'rh', 'lh']) {
        const st = m.staves[name];
        const stave = NotationRenderer.createStave(l.x, l.y + STAFF[name], l.width, {initial: mi === 0});
        if (l.first) {
          stave.addClef(st.clef).addKeySignature('Eb');
          if (!mi) stave.addTimeSignature('4/4');
        } else if (mi && st.clef !== clefAtPrevious(name, mi) && layout[mi - 1].row !== l.row) stave.addClef(st.clef, 'small');
        if (mi === data.measures.length - 1) stave.setEndBarType(VF.Barline.type.END);
        stave.setContext(ctx).draw();
        staves[name] = stave;
      }
      function clefAtPrevious(name, index) {
        const st = data.measures[index - 1].staves[name];
        return st.clefChanges.at(-1)?.clef || st.clef;
      }
      if (l.first) {
        new VF.StaveConnector(staves.rh, staves.lh).setType('brace').setContext(ctx).draw();
        new VF.StaveConnector(staves.voice, staves.lh).setType('singleLeft').setContext(ctx).draw();
      }
      // 終止線一粗一細，兩條線都在鋼琴左右手之間拉通。
      const last = mi === data.measures.length - 1;
      new VF.StaveConnector(staves.rh, staves.lh).setType(last ? 'boldDoubleRight' : 'singleRight').setContext(ctx).draw();
      ctx.setFont('Arial', 11); ctx.fillText(String(m.number), l.x + 3, l.y + 61);

      for (const name of ['voice', 'rh', 'lh']) {
        const st = m.staves[name], stave = staves[name];
        if (m.repeatStaves.includes(name)) {
          const start = stave.getNoteStartX(), cx = (start + l.x + l.width) / 2, cy = stave.getYForLine(2);
          const el = ctx.openGroup('repeat'); el.classList.add('repeat');
          ctx.beginPath(); ctx.moveTo(cx - 9, cy + 9); ctx.lineTo(cx + 9, cy - 9); ctx.setLineWidth(4); ctx.stroke(); ctx.setLineWidth(1);
          for (const [dx, dy] of [[-7, -6], [7, 6]]) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 2.2, 0, Math.PI * 2, false); ctx.fill(); }
          ctx.closeGroup(); repeats.push({el, measure: mi, staff: name});
          continue;
        }
        const staffVoices = [];
        // Sibelius 的 voice 編號不保證始終由高到低（例如第 19、21 小節）。
        // 依本小節記譜音域與時值決定高低聲部，不用陣列順序猜測。
        const register = list => {
          let total = 0, weight = 0;
          list.filter(n => !n.rest).forEach(n => {
            const duration = n.duration || 1;
            total += n.keys.reduce((sum, key) => sum + pitchStep(key), 0) / n.keys.length * duration;
            weight += duration;
          });
          return weight ? total / weight : -Infinity;
        };
        const order = st.voices.map((list, index) => ({index, register: register(list)})).sort((a, b) => b.register - a.register);
        st.voices.forEach((list, voiceIndex) => {
          const notes = [], originals = [];
          const multiVoice = st.voices.length > 1;
          const voiceDirection = multiVoice ? (order[0].index === voiceIndex ? VF.Stem.UP : VF.Stem.DOWN) : null;
          let changeIndex = 0;
          list.forEach(n => {
            while (voiceIndex === 0 && changeIndex < st.clefChanges.length && st.clefChanges[changeIndex].beat <= n.beat) {
              const clefNote = new VF.ClefNote(st.clefChanges[changeIndex++].clef, 'small');
              notes.push(clefNote); clefNotes.push({clefNote, n});
            }
            if (n.rest && n.hidden) {
              // 隱藏的是字形，不是拍值；GhostNote 繼續參與節奏排版。
              const ghost = new VF.GhostNote({duration: n.type + 'd'.repeat(n.dots)});
              ghost.setStave(stave); notes.push(ghost); originals.push({note: ghost, n}); timed.push({note: ghost, n});
              return;
            }
            const clef = clefAt(name, n.beat);
            const keys = n.rest ? [n.type === 'w' ? (clef === 'bass' ? 'f/3' : 'd/5') : (clef === 'bass' ? 'd/3' : 'b/4')] : n.keys.map(k => n.x ? k + '/x2' : k);
            const note = new VF.StaveNote({clef, keys, duration: n.type + 'd'.repeat(n.dots) + (n.rest ? 'r' : ''),
              ...(voiceDirection ? {stem_direction: voiceDirection} : n.stem ? {stem_direction: n.stem === 'down' ? -1 : 1} : {auto_stem: true})});
            note.setStave(stave);
            n.acc.forEach((acc, index) => { if (acc) note.addModifier(new VF.Accidental(acc), index); });
            for (let d = 0; d < n.dots; d++) VF.Dot.buildAndAttach([note], {all: true});
            // 本曲的琶音跨越大譜表；不畫只涵蓋右手的不完整琶音記號。
            if (n.fermata) fermatas.push({note, n, staff: name, measure: mi, row: l.row});
            if (n.rest) {
              visibleRests.push({note, n, staff: name, measure: mi, row: l.row, direction: voiceDirection});
              if (multiVoice && n.type !== 'w') {
                // 高聲部休止符避開低聲部；5、7 小節依老師指定放上加一間。
                const line = voiceDirection === VF.Stem.UP ? (name === 'lh' && [5, 7].includes(m.number) ? 5.5 : 3) : 1;
                restLines.push({note, line});
              }
            }
            if (n.rest && n.type === 'w' && list.length === 1) rests.push({note, stave});
            if (n.lyric) lyrics.push({note, n, row: l.row, y: l.y + STAFF.voice + 110});
            if (!n.rest) {
              const record = {note, n, staff: name, voice: n.voice, track: name === 'voice' ? 1 : 2, measure: mi, beat: mi * 4 + n.beat, row: l.row, direction: voiceDirection || note.getStemDirection(), multiVoice};
              drawn.push(record);
              n.sound.forEach((pitch, index) => {
                const key = `${name}:${n.voice}:${pitch}`, flags = n.ties[index];
                let prev = openTies.get(key);
                if (flags.stop && !prev) prev = [...openTies].find(([other]) => other.startsWith(name + ':') && other.endsWith(':' + pitch))?.[1];
                if (flags.stop && prev) ties.push({a: prev, b: {note, index, row: l.row}, direction: prev.chordTie ? prev.tieDirection : prev.voiceDirection ? prev.tieDirection : voiceDirection ? -voiceDirection : prev.tieDirection, staff: name});
                if (flags.start) {
                  const tied = n.ties.map((flags, index) => ({flags, index})).filter(x => x.flags.start).sort((a, b) => pitchStep(n.keys[a.index]) - pitchStep(n.keys[b.index]));
                  // 一個譜表兩個聲部時，延音線方向由聲部決定：高聲部向上、低聲部向下。
                  const chordTie = tied.length > 1 && !voiceDirection;
                  const tieDirection = chordTie ? (index === tied[0].index ? 1 : -1) : voiceDirection ? -voiceDirection : note.getStemDirection();
                  openTies.set(key, {note, index, row: l.row, voiceDirection, chordTie, tieDirection});
                } else openTies.delete(key);
              });
            }
            notes.push(note); originals.push({note, n}); timed.push({note, n});
          });
          // MusicXML 的 170/171 ticks 是三分之一的捨入；由 VexFlow 的 Tuplet 還原準確比例。
          for (let i = 0; i < originals.length; i++) {
            const spec = originals[i].n.tuplet;
            if (!spec) continue;
            const group = originals.slice(i, i + spec.actual).map(x => x.note);
            tuplets.push(new VF.Tuplet(group, {num_notes: spec.actual, notes_occupied: spec.normal, bracketed: true}));
            i += spec.actual - 1;
          }
          const voice = new VF.Voice({num_beats: 4, beat_value: 4}).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
          voice.__stave = stave; voices.push(voice); staffVoices.push(voice);
          let beamGroup = [];
          originals.forEach(({note, n}) => {
            if (n.beam === 'begin') beamGroup = [note];
            else if (n.beam === 'continue') beamGroup.push(note);
            else if (n.beam === 'end') { beamGroup.push(note); if (beamGroup.length > 1) beams.push(new VF.Beam(beamGroup)); beamGroup = []; }
          });
        });
        if (staffVoices.length) formatter.joinVoices(staffVoices);
      }
      if (voices.length) {
        const noteStart = Math.max(...Object.values(staves).map(s => s.getNoteStartX()));
        Object.values(staves).forEach(s => s.setNoteStartX(noteStart));
        formatter.format(voices, Math.max(80, l.x + l.width - noteStart - 25));
        // 拍位共用同一條時間軸；不用多聲部平均時值造成的光學間距。
        // 格式器仍處理變音記號與聲部，最後只重排 TickContext 的橫座標。
        const musicStart = noteStart + 16, musicEnd = l.x + l.width;
        const contexts = new Set();
        timed.forEach(({note, n}) => {
          const tick = note.getTickContext();
          if (contexts.has(tick)) return;
          const center = musicStart + n.beat / 4 * (musicEnd - musicStart);
          tick.setX(tick.getX() + center - note.getAbsoluteX() - 6);
          contexts.add(tick);
        });
        // 不同聲部的二度或同音不能把符頭畫在同一位置：整個高聲部和弦向右錯開。
        // 以標準位置為參考：先取消 VexFlow 自動的聲部錯開，同一拍盡量保持同一 X 座標。
        drawn.filter(p => p.multiVoice).forEach(p => p.note.setXShift(0));
        // 只有二度相撞時，低聲部（符干朝下）整個和弦往右移到剛好與高聲部符頭沒有像素重疊，高聲部不動；
        // 全音符同樣處理（規範 N25③，老師 2026-11-22：上下符干對齊，比較好讀）。
        const lowerNotes = drawn.filter(p => p.multiVoice && p.direction === VF.Stem.DOWN);
        lowerNotes.forEach(q => {
          const upperNotes = drawn.filter(p => p.staff === q.staff && p.beat === q.beat && p.voice !== q.voice && p.direction === VF.Stem.UP);
          for (const p of upperNotes) {
            const clash = p.note.getYs().flatMap(y => q.note.getYs().map(other => Math.abs(y - other))).filter(d => d < 9);
            if (!clash.length) continue;
            // 同音、同時值（含附點）時兩個聲部共用同一個符頭，不錯開。
            if (clash.every(d => d < 1) && p.n.type === q.n.type && p.n.dots === q.n.dots) continue;
            const right = p.note.getNoteHeadEndX(), left = q.note.getNoteHeadBeginX();
            if (left < right + 1 && q.note.getNoteHeadEndX() > p.note.getNoteHeadBeginX() - 1) q.note.setXShift(q.note.getXShift() + right + 1 - left);
          }
        });
        // 譜號變換放在下一個音符左邊，留出間距，不和音符重疊。
        clefNotes.forEach(({clefNote, n}) => {
          const next = timed.find(t => t.n === n)?.note;
          if (!next || !next.getMetrics) return;
          // 譜號與下一個音符共用 TickContext，只改譜號自己的繪製位置。
          const target = next.getNoteHeadBeginX() - next.getMetrics().modLeftPx - clefNote.getWidth() - 6;
          clefNote.getAbsoluteX = () => target;
        });
        // Formatter 的自動休止符避讓會改寫 line；最後明確套用聲部位置。
        restLines.forEach(({note, line}) => { note.setKeyLine(0, line); note.setStave(note.getStave()); });
        voices.forEach(v => v.draw(ctx, v.__stave));
        visibleRests.filter(r => r.measure === mi).forEach(r => {
          const el = r.note.getSVGElement();
          el.dataset.measure = String(mi + 1); el.dataset.staff = r.staff; el.dataset.voice = r.n.voice; el.dataset.kind = 'rest'; el.dataset.beat = String(r.n.beat); el.dataset.restLine = String(r.note.getKeyLine(0));
        });
        rests.forEach(({note, stave}) => {
          const time = stave.getModifiers().find(mod => mod.getCategory() === VF.TimeSignature.CATEGORY);
          const timeBox = time?.getSVGElement()?.getBBox();
          const start = timeBox ? timeBox.x + timeBox.width : l.first ? stave.getNoteStartX() : l.x;
          const el = note.getSVGElement(), box = el.getBBox();
          el.setAttribute('transform', `translate(${(start + l.x + l.width) / 2 - box.x - box.width / 2}, 0)`);
        });
        beams.forEach(beam => beam.setContext(ctx).draw());
        tuplets.forEach(tuplet => tuplet.setContext(ctx).draw());
        drawn.forEach(p => {
          p.el = p.note.getSVGElement();
          p.el.dataset.measure = String(mi + 1); p.el.dataset.staff = p.staff; p.el.dataset.voice = p.n.voice; p.el.dataset.kind = 'note'; p.el.dataset.beat = String(p.n.beat);
          p.el.dataset.stem = p.note.getStemDirection() === VF.Stem.UP ? 'up' : 'down';
          if (p.multiVoice) p.el.dataset.voiceRole = p.direction === VF.Stem.UP ? 'upper' : 'lower';
          placed.push(p);
          if (p.n.ottava) ottavas.push(p);
          if (p.track !== 2) return;
          const key = `${mi}:${p.n.beat}`;
          const existing = positions.find(pos => pos.key === key);
          const px = p.note.getNoteHeadBeginX() + p.note.getGlyphWidth() / 2;
          if (existing) existing.x = Math.max(existing.x, px);
          else positions.push({key, measure: mi, beat: p.n.beat, start: p.beat, x: px, y: l.y + 30, row: l.row});
        });
      }
      // 下一小節開頭換譜號且在同一行：譜號畫在本小節線之前，對齊本小節最後一拍，不另佔空間。
      const nextMeasure = data.measures[mi + 1];
      if (nextMeasure && layout[mi + 1].row === l.row) for (const name of ['voice', 'rh', 'lh']) {
        const before = m.staves[name].clefChanges.at(-1)?.clef || m.staves[name].clef, after = nextMeasure.staves[name].clef;
        if (before === after) continue;
        const lastBeat = Math.max(...drawn.map(p => p.n.beat));
        const atBeat = drawn.filter(p => p.n.beat === lastBeat);
        const clef = new VF.Clef(after, 'small');
        clef.setStave(staves[name]);
        const center = atBeat.length ? Math.max(...atBeat.map(p => p.note.getNoteHeadBeginX() + p.note.getGlyphWidth() / 2)) : l.x + l.width - 12;
        const busy = atBeat.some(p => p.staff === name);
        clef.setX(busy ? l.x + l.width - clef.getWidth() - 4 : center - clef.getWidth() / 2);
        clef.setContext(ctx).draw();
      }
      measures.push({...l, number: m.number, start: beatTime(data, mi * 4), end: beatTime(data, (mi + 1) * 4)});
    });

    // 休止符主體（不含附點）與同拍符頭中心對齊，避讓只沿垂直方向。
    for (const rest of visibleRests) {
      if (!rest.direction || rest.n.type === 'w') continue;
      const el = rest.note.getSVGElement();
      const body = el.querySelector('.vf-notehead path') || el.querySelector('.vf-notehead');
      const bodyBox = body.getBBox(), box = el.getBBox();
      const sameBeat = placed.filter(p => p.measure === rest.measure && p.staff === rest.staff && p.beat === rest.measure * 4 + rest.n.beat);
      const reference = sameBeat[0]?.el.querySelector('.vf-notehead path');
      const target = reference?.getBBox();
      const shiftX = target ? target.x + target.width / 2 - bodyBox.x - bodyBox.width / 2 : 0;
      const others = placed.filter(p => p.row === rest.row && p.staff === rest.staff && p.voice !== rest.n.voice);
      const boxes = others.map(p => p.el.getBBox());
      const active = others.filter(p => p.beat <= rest.measure * 4 + rest.n.beat && p.beat + p.n.duration > rest.measure * 4 + rest.n.beat);
      let shift = 0;
      // 低聲部休止符不能僅僅「不碰到」，還要位於同拍高聲部音符的下方。
      if (rest.direction === VF.Stem.DOWN && active.length) {
        const bottom = Math.max(...active.map(p => Math.max(...p.note.getYs()) + 5));
        shift = Math.max(0, Math.ceil((bottom + 8 - box.y) / 5) * 5);
      }
      const collides = () => boxes.some(b => box.x + shiftX < b.x + b.width + 4 && box.x + shiftX + box.width + 4 > b.x && box.y + shift < b.y + b.height + 4 && box.y + shift + box.height + 4 > b.y);
      while (collides() && Math.abs(shift) < 140) shift -= rest.direction * 5;
      if (shift || shiftX) el.setAttribute('transform', `translate(${shiftX}, ${shift})`);
      // 二分／全休止符移至譜表外時仍要有承托線；短休止符不加線。
      const stave = rest.note.getStave(), y = rest.n.type === 'h' ? bodyBox.y + bodyBox.height + shift : bodyBox.y + shift;
      if (['h', 'w'].includes(rest.n.type) && (y > stave.getYForLine(4) + 4 || y < stave.getYForLine(0) - 4)) {
        const group = ctx.openGroup('rest-ledger'); group.dataset.measure = String(rest.measure + 1); group.dataset.staff = rest.staff;
        ctx.setLineWidth(.65); ctx.beginPath(); ctx.moveTo(bodyBox.x + shiftX - 4, y); ctx.lineTo(bodyBox.x + shiftX + bodyBox.width + 4, y); ctx.stroke(); ctx.closeGroup();
      }
    }

    const tieGroups = [];
    function drawTie(notes, direction, row, staff, from) {
      const group = ctx.openGroup('sustain-tie');
      group.dataset.direction = direction < 0 ? 'up' : 'down'; group.dataset.staff = staff;
      const source = (notes.first_note || notes.last_note).getSVGElement();
      group.dataset.sourceMeasure = source.dataset.measure; group.dataset.sourceVoice = source.dataset.voice;
      new VF.StaveTie(notes).setDirection(direction).setContext(ctx).draw();
      ctx.closeGroup();
      tieBoxes.push({box: group.getBBox(), row, staff});
      tieGroups.push({group, note: from.note, index: from.index});
    }
    ties.forEach(({a, b, direction, staff}) => {
      if (a.row === b.row) drawTie({first_note: a.note, last_note: b.note, first_indices: [a.index], last_indices: [b.index]}, direction, a.row, staff, a);
      else {
        drawTie({first_note: a.note, first_indices: [a.index], last_indices: [a.index]}, direction, a.row, staff, a);
        drawTie({last_note: b.note, first_indices: [b.index], last_indices: [b.index]}, direction, b.row, staff, a);
      }
    });
    for (const fermata of fermatas) {
      const peers = placed.filter(p => p.measure === fermata.measure && p.staff === fermata.staff && p.n.beat === fermata.n.beat);
      const top = Math.min(fermata.note.getSVGElement().getBBox().y, ...peers.map(p => Math.min(p.el.getBBox().y, p.note.getBoundingBox().getY())));
      const glyph = new VF.Glyph('fermataAbove', 38);
      glyph.setOrigin(.5, 1);
      const group = ctx.openGroup('fermata'); group.dataset.measure = String(fermata.measure + 1); group.dataset.staff = fermata.staff;
      glyph.render(ctx, fermata.note.getNoteHeadBeginX() + fermata.note.getGlyphWidth() / 2, top - 12);
      ctx.closeGroup();
      tieBoxes.push({box: group.getBBox(), row: fermata.row, staff: fermata.staff});
    }
    // 每個聲部及每一行各自畫 8va，不能跨過沒有 8va 的區段。
    const runs = new Map();
    for (const p of ottavas.sort((a, b) => a.beat - b.beat)) {
      const key = `${p.row}:${p.n.ottavaRange}`;
      if (!runs.has(key)) runs.set(key, {first: p, last: p});
      else runs.get(key).last = p;
    }
    for (const run of runs.values()) {
      const startX = run.first.note.getAbsoluteX(), endX = run.last.note.getAbsoluteX() + run.last.note.getGlyphWidth();
      const covered = placed.filter(p => p.staff === 'rh' && p.row === run.first.row && p.note.getAbsoluteX() >= startX - 1 && p.note.getAbsoluteX() <= endX + 1);
      const tops = covered.flatMap(p => [p.el.getBBox().y, p.note.getBoundingBox().getY()]);
      tieBoxes.filter(t => t.row === run.first.row && t.staff === 'rh' && t.box.x <= endX && t.box.x + t.box.width >= startX).forEach(t => tops.push(t.box.y));
      const ceiling = Math.min(...tops) - 22;
      let line = 1;
      while (run.first.note.getStave().getYForTopText(line) > ceiling) line++;
      const group = ctx.openGroup('ottava');
      group.dataset.row = String(run.first.row);
      new VF.TextBracket({start: run.first.note, stop: run.last.note, text: '8', superscript: 'va', position: VF.TextBracket.Positions.TOP}).setLine(line).setContext(ctx).draw();
      ctx.closeGroup();
    }
    // 歌詞：音節最左邊與符頭最左邊對齊；擠在一起時右邊的往右讓，直到沒有像素重疊。
    // 連字符在前後音節之間的空間居中，也不與音節重疊。
    ctx.setFont('Georgia', 12);
    const hyphen = ctx.measureText('-').width, WORD_GAP = 5, HYPHEN_PAD = 3;
    let previous = null;
    const lyricBoxes = lyrics.map(lyric => {
      const {note, n, row} = lyric, metrics = ctx.measureText(n.lyric), width = metrics.width;
      let x = note.getNoteHeadBeginX();
      const joined = previous && previous.row === row && ['begin', 'middle'].includes(previous.n.syllabic);
      if (previous && previous.row === row) x = Math.max(x, previous.right + (joined ? hyphen + HYPHEN_PAD * 2 : WORD_GAP));
      const box = {...lyric, x, width, joined, previousRight: previous?.right, ascent: metrics.actualBoundingBoxAscent || 9};
      previous = {row, n, right: x + width};
      return box;
    });
    // 歌詞與音符（含加線、符干）之間留出間隙；需要下移時，全曲歌詞同一基線一起下移。
    const LYRIC_GAP = 4;
    const voiceBoxes = placed.filter(p => p.staff === 'voice').map(p => ({row: p.row, box: p.el.getBBox()}));
    const lyricShift = Math.max(0, ...lyricBoxes.map(l => Math.max(0, ...voiceBoxes
      .filter(v => v.row === l.row && v.box.x < l.x + l.width && v.box.x + v.box.width > l.x)
      .map(v => v.box.y + v.box.height + LYRIC_GAP - (l.y - l.ascent)))));
    lyricBoxes.forEach(l => {
      ctx.fillText(l.n.lyric, l.x, l.y + lyricShift);
      if (l.joined) ctx.fillText('-', (l.previousRight + l.x) / 2 - hyphen / 2, l.y + lyricShift);
    });

    const cues = [], used = new Set(), missing = [], ongoing = new Map();
    const animated = placed.slice();
    for (let mi = 0; mi < data.measures.length; mi++) {
      for (const staff of data.measures[mi].repeatStaves) {
        let source = mi - 1;
        while (source > 0 && data.measures[source].repeatStaves.includes(staff)) source--;
        placed.filter(p => p.staff === staff && p.measure === source).forEach(p => animated.push({...p, beat: mi * 4 + p.n.beat, measure: mi, repeated: true}));
      }
    }
    for (const p of animated.sort((a, b) => a.beat - b.beat || a.track - b.track)) {
      const heads = [...p.el.querySelectorAll('.vf-notehead')];
      const sorted = p.n.keys.map((key, index) => ({key, index})).sort((a, b) => pitchStep(a.key) - pitchStep(b.key));
      sorted.forEach(({index}, hi) => {
        const pitch = p.n.sound[index], flags = p.n.ties[index], tieKey = `${p.staff}:${p.voice}:${pitch}`;
        let match = null;
        if (flags.stop && !p.repeated) {
          // 只接續記譜上正好在這一拍結束的連線起點；更早留下、沒有接上的連線不算同一個聲音。
          const reaches = held => held && Math.abs(held.until - p.beat) < .01 ? held : null;
          match = reaches(ongoing.get(tieKey));
          // 延音可能從第二聲部移到第一聲部；同譜表、同音高仍是同一個聲音。
          if (!match) match = [...ongoing].map(([key, held]) => key.startsWith(p.staff + ':') && key.endsWith(':' + pitch) ? reaches(held) : null).find(Boolean) || null;
        }
        if (!match) {
          let distance = Infinity;
          data.midi.forEach((n, i) => {
            if (used.has(i) || n.track !== p.track || (!p.n.x && n.pitch !== pitch)) return;
            const d = Math.abs(n.beat - MIDI_OFFSET - p.beat);
            if (d < (p.n.x ? .12 : 1.6) && d < distance) { match = {n, i}; distance = d; }
          });
          if (match) used.add(match.i);
        }
        if (!match || !heads[hi]) { missing.push({measure: p.measure + 1, staff: p.staff, pitch, beat: p.n.beat, tied: flags.stop}); return; }
        if (flags.start) ongoing.set(tieKey, {...match, until: p.beat + p.n.duration}); else ongoing.delete(tieKey);
        // 同音連線：前後符頭與連線同時亮起，共用這個 MIDI 音塊的起止時間。
        const start = match.n.on, end = match.n.off;
        if (end > start) {
          cues.push({el: heads[hi], pitch, on: start, off: end, measure: p.measure, beat: p.n.beat, tied: flags.stop && !p.repeated, repeated: !!p.repeated, staff: p.staff, midiIndex: match.i, row: layout[p.measure].row, followX: layout[p.measure].x});
          if (flags.start && !p.repeated) tieGroups.filter(t => t.note === p.note && t.index === index)
            .forEach(t => cues.push({el: t.group, on: start, off: end, measure: p.measure, staff: p.staff, tie: true, row: layout[p.measure].row}));
        }
      });
    }
    data.midi.forEach((n, i) => {
      if (used.has(i)) return;
      const beat = n.beat - MIDI_OFFSET;
      const p = placed.find(p => p.track === n.track && p.n.sound.includes(n.pitch) && p.beat <= beat && beat < p.beat + p.n.duration);
      if (!p) return;
      const index = p.n.sound.indexOf(n.pitch);
      const order = p.n.keys.map((key, index) => ({key, index})).sort((a, b) => pitchStep(a.key) - pitchStep(b.key));
      const el = p.el.querySelectorAll('.vf-notehead')[order.findIndex(x => x.index === index)];
      cues.push({el, pitch: n.pitch, on: n.on, off: n.off, measure: p.measure, beat: beat - p.measure * 4, extra: true, staff: p.staff, midiIndex: i, row: p.row});
      used.add(i);
    });
    for (const r of repeats) {
      const repeatedStaves = data.measures[r.measure].repeatStaves;
      const notes = cues.filter(c => c.measure === r.measure && repeatedStaves.includes(c.staff));
      if (notes.length) cues.push({el: r.el, on: Math.min(...notes.map(n => n.on)), off: Math.max(...notes.map(n => n.off)), measure: r.measure, row: layout[r.measure].row, followX: layout[r.measure].x});
    }
    const svg = host.querySelector('svg');
    positions.sort((a, b) => a.start - b.start);
    positions.forEach(pos => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', 4);
      circle.setAttribute('class', 'analysis-dot'); circle.setAttribute('tabindex', '0'); circle.setAttribute('role', 'button');
      circle.setAttribute('aria-label', `第 ${pos.measure + 1} 小节，第 ${pos.beat + 1} 拍，写和弦记号`);
      circle.dataset.position = pos.key;
      circle.addEventListener('click', () => onSelect(pos));
      circle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(pos); } });
      svg.append(circle);
    });
    return {svg, width, height, staffY: STAFF, positions, cues, measures, missing, usedMidi: used.size, beatTime: beat => beatTime(data, beat)};
  }
  window.SnowmanScore = {mount, beatTime};
})();
