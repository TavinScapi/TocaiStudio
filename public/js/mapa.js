$(document).ready(function () {
  const slideSpeed = 300;
  let noteToShow = "All";
  let canClick = true;

  const notes = {
    'low-e': ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'],
    a: ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
    d: ['D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D'],
    g: ['G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G'],
    b: ['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    'high-e': ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E']
  };

  const strings = ['low-e', 'a', 'd', 'g', 'b', 'high-e'];

  function initNotes() {
    strings.forEach((stringName) => {
      const ul = $('.mask.' + stringName + ' ul');
      ul.empty();
      notes[stringName].forEach(note => {
        ul.append(`<li note="${note}">${note}</li>`);
      });
    });
  }

  initNotes();

  // Afinar todas -1/2 tom
  $('#tune-down').click(function (e) {
    e.preventDefault();
    if (!canClick) return false;
    canClick = false;

    $('.mask').each(function () {
      const el = $(this);
      const nextNote = el.find('li:nth-child(12)').text();

      el.animate({ right: -268 }, slideSpeed);
      setTimeout(function () {
        el.find('ul').prepend(`<li note="${nextNote}">${nextNote}</li>`);
        el.find('li:last-child').remove();
        el.css({ right: -189 });
      }, slideSpeed + 20);
    });

    setTimeout(function () {
      changeAllOpenNotes();
      showNotes(noteToShow);
      canClick = true;
    }, slideSpeed + 40);
    return false;
  });

  // Afinar todas +1/2 tom
  $('#tune-up').click(function (e) {
    e.preventDefault();
    if (!canClick) return false;
    canClick = false;

    $('.mask').each(function () {
      const el = $(this);
      const nextNote = el.find('li:nth-child(2)').text();

      el.find('ul').append(`<li note="${nextNote}">${nextNote}</li>`);
      el.css({ right: -268 });
      el.find('li:first-child').remove();
      el.animate({ right: -189 }, slideSpeed);
    });

    setTimeout(function () {
      changeAllOpenNotes();
      showNotes(noteToShow);
      canClick = true;
    }, slideSpeed + 40);
    return false;
  });

  // Afinar corda individual -1/2 tom
  $('.tune-down-string').click(function () {
    if (!canClick) return false;
    canClick = false;

    const stringClass = $(this).closest('.string-tuner').data('string');
    const el = $('.mask.' + stringClass);
    const nextNote = el.find('li:nth-child(12)').text();

    el.animate({ right: -268 }, slideSpeed);
    setTimeout(function () {
      el.find('ul').prepend(`<li note="${nextNote}">${nextNote}</li>`);
      el.find('li:last-child').remove();
      el.css({ right: -189 });

      changeOpenNote(stringClass);
      showNotes(noteToShow);
      canClick = true;
    }, slideSpeed + 20);
  });

  // Afinar corda individual +1/2 tom
  $('.tune-up-string').click(function () {
    if (!canClick) return false;
    canClick = false;

    const stringClass = $(this).closest('.string-tuner').data('string');
    const el = $('.mask.' + stringClass);
    const nextNote = el.find('li:nth-child(2)').text();

    el.find('ul').append(`<li note="${nextNote}">${nextNote}</li>`);
    el.css({ right: -268 });
    el.find('li:first-child').remove();
    el.animate({ right: -189 }, slideSpeed);

    setTimeout(function () {
      changeOpenNote(stringClass);
      showNotes(noteToShow);
      canClick = true;
    }, slideSpeed + 20);
  });

  // Atualiza uma corda específica
  function changeOpenNote(stringClass) {
    const note = $('.mask.' + stringClass + ' li:last-child').text();
    $('.open-notes .' + stringClass).text(note);
  }

  // Atualiza todas as cordas abertas
  function changeAllOpenNotes() {
    strings.forEach((stringClass) => {
      changeOpenNote(stringClass);
    });
  }

  // Mostrar/esconder notas conforme seleção
  function showNotes(noteToShow) {
    const allNotes = $('.guitar-neck .notes li');
    allNotes.removeClass('highlight');
    if (noteToShow === "All") {
      allNotes.animate({ opacity: 1 }, 500);
    } else {
      allNotes.each(function () {
        const isMatch = $(this).attr('note') === noteToShow;
        $(this).animate({ opacity: isMatch ? 1 : 0 }, 500);
        if (isMatch) $(this).addClass('highlight');
      });
    }
  }

  // Clique para selecionar nota
  $('#note-selector li').click(function () {
    $('#note-selector li').removeClass('active');
    $(this).addClass('active');
    noteToShow = $(this).data('note');
    showNotes(noteToShow);
  });
});