document.addEventListener('DOMContentLoaded', () => {
  const cursorBook = document.createElement('div');
  cursorBook.className = 'cursor-book';
  cursorBook.textContent = '📖';
  cursorBook.setAttribute('aria-hidden', 'true');
  document.body.append(cursorBook);

  let previousX = null;
  let previousY = null;
  document.addEventListener('mousemove', (event) => {
    const deltaX = previousX === null ? 0 : event.clientX - previousX;
    const deltaY = previousY === null ? 0 : event.clientY - previousY;
    const distance = Math.hypot(deltaX, deltaY);
    const offset = distance ? Math.min(34, distance * 0.45) : 0;
    const directionX = distance ? deltaX / distance : 0;
    const directionY = distance ? deltaY / distance : 0;

    cursorBook.style.left = `${event.clientX - directionX * offset}px`;
    cursorBook.style.top = `${event.clientY - directionY * offset}px`;
    cursorBook.style.setProperty('--book-angle', `${Math.atan2(deltaY, deltaX) * 0.2 - 12}deg`);
    cursorBook.classList.add('is-visible');
    previousX = event.clientX;
    previousY = event.clientY;
  });
  document.addEventListener('mouseleave', () => cursorBook.classList.remove('is-visible'));

  const libraryStorageKey = 'alathurpadi-library-students';
  const batchNames = [...Array.from({ length: 7 }, (_, index) => `Batch ${index + 1}`), 'Suffa'];
  const batchStudentNames = [
    'Aisha Rahman', 'Muhammed Yasin', 'Fathima Noor', 'Abdul Kareem', 'Hana Fathima',
    'Mohammed Irfan', 'Sana Fathima', 'Abdullah Ali', 'Nimra Basheer', 'Yaseen Ahmed',
    'Rafiya Sultana', 'Ahammed Niyas', 'Jumana K', 'Ashfaq P', 'Zainab Huda',
    'Hassan Ali', 'Fida Fathima', 'Adhil Noushad', 'Naureen S', 'Rahma Nizar',
    'Mohamed Safwan', 'Sajna Beegum', 'Afnan Yusuf', 'Inaya Rahman', 'Arif Navas',
    'Nihar Ahammed', 'Liyana Khadeeja', 'Shahul Hameed', 'Rashida Banu', 'Muneer Babu',
    'Amina Fathima', 'Jabeen Beevi', 'Husna K', 'Basil Abdulla', 'Mariam Nazeer',
    'Sulaiman A', 'Noorul Ameen', 'Hiba Fathima', 'Sameer Karim', 'Alaaudeen A',
    'Shamna P', 'Farhan Sadique', 'Yusra Shafi', 'Nabeel Ahmed', 'Fayiza Beevi',
    'Suhail M', 'Midhila K', 'Rizwan C', 'Mubashira S', 'Anwar Ali', 'Nayha J',
    'Mufeedh M', 'Ashrin K', 'Hadiya P', 'Sana Mariyam', 'Hajira M', 'Nazar A',
    'Nafla K', 'Basil K', 'Sumaiya B', 'Faris H', 'Khadija S'
  ];
  const initialLibraryData = [
    { id: 'student-1', name: 'Aisha Rahman', roll: '001', libraryId: 'LD-2014', batch: 'Batch 1', status: 'Active' },
    { id: 'student-2', name: 'Muhammed Yasin', roll: '002', libraryId: 'LD-2048', batch: 'Batch 1', status: 'Issued' },
    { id: 'student-3', name: 'Fathima Noor', roll: '003', libraryId: 'LD-2091', batch: 'Batch 1', status: 'Active' },
    { id: 'student-4', name: 'Abdul Kareem', roll: '004', libraryId: 'LD-2117', batch: 'Batch 1', status: 'Overdue' },
    { id: 'student-5', name: 'Hana Fathima', roll: '005', libraryId: 'LD-2184', batch: 'Batch 1', status: 'Active' },
    { id: 'student-6', name: 'Mohammed Irfan', roll: '006', libraryId: 'LD-2230', batch: 'Batch 1', status: 'Issued' }
  ];
  const batchStudentSeed = batchNames.flatMap((batch, batchIndex) =>
    Array.from({ length: 50 }, (_, index) => {
      const knownStudent = batchIndex === 0 ? initialLibraryData[index] : null;
      const batchCode = `B${batchIndex + 1}`;
      return {
        id: knownStudent?.id || `batch-${batchCode.toLowerCase()}-${index + 1}`,
        name: knownStudent?.name || batchStudentNames[index % batchStudentNames.length],
        roll: String(index + 1).padStart(3, '0'),
        libraryId: knownStudent?.libraryId || (batchIndex === 0
          ? `LD-${1000 + index + 1}`
          : `LD-${batchCode}-${String(index + 1).padStart(3, '0')}`),
        batch,
        status: knownStudent?.status || (index % 5 === 0 ? 'Issued' : 'Active')
      };
    })
  );
  const batchSeedMigrationKey = 'alathurpadi-library-batch-seed-v1';

  const loadSharedLibraryData = () => {
    let students = initialLibraryData.map((student) => ({ ...student }));
    const savedStudents = localStorage.getItem(libraryStorageKey);
    if (savedStudents !== null) {
      const parsedStudents = JSON.parse(savedStudents);
      if (!Array.isArray(parsedStudents) || parsedStudents.some((student) =>
        !student ||
        typeof student.id !== 'string' ||
        typeof student.name !== 'string' ||
        typeof student.libraryId !== 'string'
      )) {
        throw new Error('Saved student records are invalid.');
      }
      students = parsedStudents.map((student) => ({
        ...student,
        roll: typeof student.roll === 'string' ? student.roll : '',
        batch: batchNames.includes(student.batch) ? student.batch : 'Batch 1',
        status: ['Active', 'Issued', 'Overdue'].includes(student.status) ? student.status : 'Active'
      }));
    }

    if (localStorage.getItem(batchSeedMigrationKey) !== 'true') {
      const knownLibraryIds = new Set(students.map((student) => student.libraryId.toLowerCase()));
      batchStudentSeed.forEach((seedStudent) => {
        if (!knownLibraryIds.has(seedStudent.libraryId.toLowerCase())) {
          students.push(seedStudent);
          knownLibraryIds.add(seedStudent.libraryId.toLowerCase());
        }
      });
      students = students.map((student) => {
        if (student.roll) return student;
        const matchingSeed = batchStudentSeed.find((seedStudent) => seedStudent.libraryId === student.libraryId);
        return { ...student, roll: matchingSeed?.roll || '' };
      });
      localStorage.setItem(libraryStorageKey, JSON.stringify(students));
      localStorage.setItem(batchSeedMigrationKey, 'true');
    }

    return students;
  };

  const saveSharedLibraryData = (students) => {
    try {
      localStorage.setItem(libraryStorageKey, JSON.stringify(students));
      return true;
    } catch (error) {
      return false;
    }
  };

  const syncStudentCirculationStatus = (libraryId, borrowedBooks) => {
    try {
      const students = loadSharedLibraryData();
      const student = students.find((record) => record.libraryId.toLowerCase() === libraryId.toLowerCase());
      if (!student) return false;
      const studentLoans = borrowedBooks.filter((book) => book.libraryId.toLowerCase() === libraryId.toLowerCase());
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const hasOverdueBook = studentLoans.some((book) => {
        const dueDate = new Date(`${book.issuedDate}T00:00:00Z`);
        dueDate.setUTCDate(dueDate.getUTCDate() + 14);
        return dueDate < today;
      });
      student.status = hasOverdueBook ? 'Overdue' : studentLoans.length ? 'Issued' : 'Active';
      return saveSharedLibraryData(students);
    } catch (error) {
      return false;
    }
  };

  const getFineDetails = (book) => {
    const dueDate = new Date(`${book.issuedDate}T00:00:00Z`);
    dueDate.setUTCDate(dueDate.getUTCDate() + 14);
    const returnedDate = new Date(`${String(book.returnedAt || '').slice(0, 10)}T00:00:00Z`);
    const validReturnDate = !Number.isNaN(returnedDate.getTime());
    const lateDays = validReturnDate
      ? Math.max(0, Math.ceil((returnedDate.getTime() - dueDate.getTime()) / 86400000))
      : Number(book.lateDays) || 0;
    return {
      lateDays,
      fineAmount: Number.isFinite(Number(book.fineAmount)) ? Number(book.fineAmount) : lateDays * 5
    };
  };

  const batchStudentList = document.getElementById('batch-student-list');

  if (batchStudentList) {
    const batchTitle = document.getElementById('batch-title');
    const batchTotal = document.getElementById('batch-total');
    const batchSearch = document.getElementById('batch-search');
    const batchStudentForm = document.getElementById('batch-student-form');
    const batchStudentMessage = document.getElementById('batch-student-message');
    const params = new URLSearchParams(window.location.search);
    const selectedBatch = batchNames.includes(params.get('batch')) ? params.get('batch') : 'Batch 1';
    let libraryData;
    try {
      libraryData = loadSharedLibraryData();
    } catch (error) {
      libraryData = [];
      if (batchStudentMessage) batchStudentMessage.textContent = 'Saved student records could not be read.';
    }

    if (batchTitle) batchTitle.textContent = selectedBatch;

    let activeEditIndex = null;
    let activeBooksStudentLibraryId = null;

    const getStudentBorrowedBooks = (student) => {
      try {
        const savedBooks = JSON.parse(localStorage.getItem('alathurpadi-library-borrowed-books') || '[]');
        if (!Array.isArray(savedBooks)) return [];
        return savedBooks.filter((book) => {
          if (!book) return false;
          const matchesStudent = book.studentName === student.name || book.libraryId === student.libraryId;
          return matchesStudent && typeof book.bookName === 'string' && typeof book.bookNumber === 'string';
        });
      } catch (error) {
        return [];
      }
    };

    const getFilteredRows = () => {
      const term = (batchSearch?.value || '').trim().toLowerCase();
      const batchStudents = libraryData.filter((student) => student.batch === selectedBatch);
      if (!term) return batchStudents;
      return batchStudents.filter((student) =>
        `${student.name} ${student.roll} ${student.libraryId}`.toLowerCase().includes(term)
      );
    };

    const renderBatchStudents = () => {
      batchStudentList.replaceChildren();
      const filteredRows = getFilteredRows();
      if (batchTotal) batchTotal.textContent = String(filteredRows.length);

      filteredRows.forEach((student, index) => {
        const row = document.createElement('article');
        row.className = 'batch-student-card';

        if (activeEditIndex === index) {
          const editor = document.createElement('div');
          editor.className = 'batch-student-editor';

          const fields = [
            { label: 'Name', key: 'name', value: student.name },
            { label: 'Roll', key: 'roll', value: student.roll },
            { label: 'Library', key: 'libraryId', value: student.libraryId },
            { label: 'Status', key: 'status', value: student.status }
          ];

          fields.forEach(({ label, key, value }) => {
            const field = document.createElement('label');
            field.className = 'batch-field';
            field.textContent = label;

            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.dataset.key = key;
            field.append(input);
            editor.append(field);
          });

          const actions = document.createElement('div');
          actions.className = 'batch-card-actions';

          const saveButton = document.createElement('button');
          saveButton.type = 'button';
          saveButton.className = 'batch-card-button batch-save-button';
          saveButton.textContent = 'Save';
          saveButton.addEventListener('click', () => {
            const previousStudent = { ...student };
            const inputs = editor.querySelectorAll('input');
            inputs.forEach((input) => {
              const key = input.dataset.key;
              if (key === 'name') student.name = input.value.trim() || student.name;
              if (key === 'roll') student.roll = input.value.trim() || student.roll;
              if (key === 'libraryId') student.libraryId = input.value.trim() || student.libraryId;
              if (key === 'status') student.status = input.value.trim() || student.status;
            });
            if (!student.name || !student.libraryId || !/^\d{1,3}$/.test(student.roll)) {
              Object.assign(student, previousStudent);
              if (batchStudentMessage) batchStudentMessage.textContent = 'Enter a name, library ID, and a roll number of up to three digits.';
              return;
            }
            const duplicateLibraryId = libraryData.some((record) =>
              record !== student && record.libraryId.toLowerCase() === student.libraryId.toLowerCase()
            );
            if (duplicateLibraryId) {
              Object.assign(student, previousStudent);
              if (batchStudentMessage) batchStudentMessage.textContent = 'That library ID is already assigned to another student.';
              return;
            }
            if (!saveSharedLibraryData(libraryData)) {
              Object.assign(student, previousStudent);
              if (batchStudentMessage) batchStudentMessage.textContent = 'Could not save this student. Check browser storage and try again.';
              return;
            }
            activeEditIndex = null;
            if (batchStudentMessage) batchStudentMessage.textContent = `${student.name} updated.`;
            renderBatchStudents();
          });

          const cancelButton = document.createElement('button');
          cancelButton.type = 'button';
          cancelButton.className = 'batch-card-button batch-cancel-button';
          cancelButton.textContent = 'Cancel';
          cancelButton.addEventListener('click', () => {
            activeEditIndex = null;
            renderBatchStudents();
          });

          actions.append(saveButton, cancelButton);
          row.append(editor, actions);
        } else {
          const name = document.createElement('h3');
          name.textContent = student.name;

          const studentIssuedBooks = getStudentBorrowedBooks(student);
          const shouldShowBooks = activeBooksStudentLibraryId === student.libraryId;

          const details = document.createElement('div');
          details.className = 'batch-student-meta';
          details.innerHTML = `
            <span><strong>Roll:</strong> ${student.roll}</span>
            <span><strong>Library:</strong> ${student.libraryId}</span>
            <span><strong>Status:</strong> ${student.status}</span>
          `;

          const actions = document.createElement('div');
          actions.className = 'batch-card-actions';

          const viewBooksButton = document.createElement('button');
          viewBooksButton.type = 'button';
          viewBooksButton.className = 'batch-card-button';
          viewBooksButton.textContent = shouldShowBooks ? 'Hide Books' : `Books (${studentIssuedBooks.length})`;
          viewBooksButton.addEventListener('click', () => {
            activeBooksStudentLibraryId = shouldShowBooks ? null : student.libraryId;
            renderBatchStudents();
          });

          const editButton = document.createElement('button');
          editButton.type = 'button';
          editButton.className = 'batch-card-button';
          editButton.textContent = 'Edit';
          editButton.addEventListener('click', () => {
            activeEditIndex = index;
            renderBatchStudents();
          });

          actions.append(viewBooksButton, editButton);

          if (shouldShowBooks) {
            const issuedBooksList = document.createElement('div');
            issuedBooksList.className = 'student-issued-books';

            if (!studentIssuedBooks.length) {
              const emptyState = document.createElement('p');
              emptyState.className = 'student-issued-empty';
              emptyState.textContent = 'No books issued yet.';
              issuedBooksList.append(emptyState);
            } else {
              studentIssuedBooks.forEach((book) => {
                const item = document.createElement('div');
                item.className = 'student-issued-book';
                item.innerHTML = `
                  <strong>${book.bookName}</strong>
                  <span>${book.bookNumber}</span>
                  <small>${book.category || 'General'}</small>
                `;
                issuedBooksList.append(item);
              });
            }
            row.append(name, details, actions, issuedBooksList);
          } else {
            row.append(name, details, actions);
          }
        }

        batchStudentList.append(row);
      });
    };

    if (batchSearch) {
      batchSearch.addEventListener('input', () => {
        activeEditIndex = null;
        activeBooksStudentLibraryId = null;
        renderBatchStudents();
      });
    }

    if (batchStudentForm) {
      batchStudentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(batchStudentForm);
        const student = {
          id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: String(formData.get('name') || '').trim(),
          roll: String(formData.get('roll') || '').trim(),
          libraryId: String(formData.get('libraryId') || '').trim(),
          batch: selectedBatch,
          status: 'Active'
        };
        if (!student.name || !/^\d{1,3}$/.test(student.roll) || !student.libraryId) {
          if (batchStudentMessage) batchStudentMessage.textContent = 'Enter a student name, a roll number of up to three digits, and a library ID.';
          return;
        }
        if (libraryData.some((record) => record.libraryId.toLowerCase() === student.libraryId.toLowerCase())) {
          if (batchStudentMessage) batchStudentMessage.textContent = 'That library ID is already registered.';
          return;
        }
        libraryData.push(student);
        if (!saveSharedLibraryData(libraryData)) {
          libraryData.pop();
          if (batchStudentMessage) batchStudentMessage.textContent = 'Could not save this student. Check browser storage and try again.';
          return;
        }
        batchStudentForm.reset();
        if (batchSearch) batchSearch.value = '';
        if (batchStudentMessage) batchStudentMessage.textContent = `${student.name} added to ${selectedBatch}.`;
        renderBatchStudents();
      });
    }

    window.addEventListener('storage', (event) => {
      if (event.key !== libraryStorageKey) return;
      try {
        libraryData = loadSharedLibraryData();
        renderBatchStudents();
      } catch (error) {
        if (batchStudentMessage) batchStudentMessage.textContent = 'Updated student records could not be read.';
      }
    });

    renderBatchStudents();
  }

  const bookCategories = [
    { name: 'Islamic Studies & Philosophy', books: [
      { title: 'Wings of Knowledge', author: 'Dr. A. P. J. Abdul Kalam', barcode: '9780140123451' },
      { title: 'In the Footsteps of the Prophet', author: 'Tariq Ramadan', barcode: '9780195308808' },
      { title: 'Islam Between East and West', author: 'Alija Izetbegović', barcode: '9780892591398' }
    ] },
    { name: 'Arabic Grammar & Language', books: [
      { title: 'Al-Ajrumiyyah Explanations', author: 'Ibn Adjurrum', barcode: '9781905837007' },
      { title: 'Arabic Grammar in Context', author: 'Mohammad Alhawary', barcode: '9780415779036' },
      { title: 'Modern Standard Arabic', author: 'Karin C. Ryding', barcode: '9780521001533' }
    ] },
    { name: 'Fiction & Novels', books: [
      { title: 'The Alchemist', author: 'Paulo Coelho', barcode: '9780062315007' },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', barcode: '9780060935467' },
      { title: 'The Kite Runner', author: 'Khaled Hosseini', barcode: '9781594631931' }
    ] },
    { name: 'Science & Technology', books: [
      { title: 'A Brief History of Time', author: 'Stephen Hawking', barcode: '9780553380163' },
      { title: 'Clean Code', author: 'Robert C. Martin', barcode: '9780132350884' },
      { title: 'Algorithms Unlocked', author: 'Thomas H. Cormen', barcode: '9780262518802' }
    ] },
    { name: 'History & Civilization', books: [
      { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', barcode: '9780062316097' },
      { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', barcode: '9780393317008' },
      { title: 'The Silk Roads', author: 'Peter Frankopan', barcode: '9781101912379' }
    ] },
    { name: 'Mathematics & Computing', books: [
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', barcode: '9780262033848' },
      { title: 'The Art of Computer Programming', author: 'Donald Knuth', barcode: '9780201896831' },
      { title: 'Discrete Mathematics', author: 'Kenneth Rosen', barcode: '9781259676512' }
    ] },
    { name: 'Biographies & Memoirs', books: [
      { title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', barcode: '9788173711466' },
      { title: 'Long Walk to Freedom', author: 'Nelson Mandela', barcode: '9780316548182' },
      { title: 'Steve Jobs', author: 'Walter Isaacson', barcode: '9781451648539' }
    ] },
    { name: 'Self-Help & Personal Growth', books: [
      { title: 'Atomic Habits', author: 'James Clear', barcode: '9780735211292' },
      { title: 'Deep Work', author: 'Cal Newport', barcode: '9781455586691' },
      { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', barcode: '9781982137274' }
    ] },
    { name: 'Malayalam & Regional Literature', books: [
      { title: 'Aatujeevitham (Goat Days)', author: 'Benyamin', barcode: '9788126419813' },
      { title: 'Balyakalasakhi', author: 'Vaikom Muhammad Basheer', barcode: '9788126402099' },
      { title: 'Naalukettu', author: 'M. T. Vasudevan Nair', barcode: '9788126400347' }
    ] },
    { name: 'Children & Young Adult', books: [
      { title: "Harry Potter and the Sorcerer's Stone", author: 'J. K. Rowling', barcode: '9780590353427' },
      { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', barcode: '9780156012195' },
      { title: 'Matilda', author: 'Roald Dahl', barcode: '9780142410370' }
    ] }
  ];
  const bookInventory = [
    { bookNumber: 'BK-100318', bookName: 'Foundations of Physics', category: 'Physics', author: 'Not listed' },
    { bookNumber: 'BK-100245', bookName: 'Algebra Basics', category: 'Mathematics', author: 'Not listed' },
    { bookNumber: 'BK-100412', bookName: 'The World of Science', category: 'Science', author: 'Not listed' },
    { bookNumber: 'BK-100587', bookName: 'A Short History of Kerala', category: 'History', author: 'Not listed' },
    { bookNumber: 'BK-100632', bookName: 'English Reader', category: 'English', author: 'Not listed' },
    { bookNumber: 'BK-100701', bookName: 'Introduction to Biology', category: 'Biology', author: 'Not listed' },
    { bookNumber: 'BK-100702', bookName: 'Library Science Handbook', category: 'Library Science', author: 'Not listed' },
    { bookNumber: 'BK-100703', bookName: 'Malayalam Reader', category: 'Malayalam', author: 'Not listed' },
    ...bookCategories.flatMap((category) => category.books.map((book) => ({
      bookNumber: book.barcode,
      bookName: book.title,
      category: category.name,
      author: book.author
    })))
  ];
  const findInventoryBook = (bookNumber) => {
    const normalizedNumber = bookNumber.trim().toUpperCase();
    return bookInventory.find((book) => book.bookNumber.toUpperCase() === normalizedNumber);
  };
  const enrichBorrowedBook = (book) => {
    const inventoryBook = findInventoryBook(book.bookNumber);
    return {
      ...book,
      bookNumber: inventoryBook ? inventoryBook.bookNumber : book.bookNumber,
      bookName: inventoryBook ? inventoryBook.bookName : book.bookName,
      category: inventoryBook ? inventoryBook.category : (book.category || 'Not listed'),
      author: inventoryBook ? inventoryBook.author : (book.author || 'Not listed'),
      batch: book.batch || 'Batch 1'
    };
  };

  const categoryGrid = document.getElementById('category-grid');
  const categoryModal = document.getElementById('category-modal');
  const categoryModalTitle = document.getElementById('category-modal-title');
  const categoryBookList = document.getElementById('category-book-list');
  const categoryMessage = document.getElementById('category-message');
  const categoryCloseButton = document.querySelector('.category-modal-close');

  if (categoryGrid && categoryModal && categoryModalTitle && categoryBookList && categoryMessage && categoryCloseButton) {
    let activeCategoryButton = null;
    const closeCategoryModal = () => {
      categoryModal.classList.remove('is-open');
      categoryModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (activeCategoryButton) activeCategoryButton.focus();
    };

    bookCategories.forEach((category, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-option';
      button.setAttribute('aria-haspopup', 'dialog');
      button.innerHTML = `<span class="category-option-number">${String(index + 1).padStart(2, '0')}</span><span class="category-option-name"></span><span class="category-option-count">3 sample books</span>`;
      button.querySelector('.category-option-name').textContent = category.name;
      button.addEventListener('click', () => {
        activeCategoryButton = button;
        categoryModalTitle.textContent = category.name;
        categoryMessage.textContent = '';
        categoryBookList.replaceChildren();

        category.books.forEach((book) => {
          const card = document.createElement('article');
          card.className = 'category-book-card';
          const title = document.createElement('h3');
          title.textContent = book.title;
          const author = document.createElement('p');
          author.className = 'category-book-author';
          author.textContent = `By ${book.author}`;
          const barcodeLabel = document.createElement('span');
          barcodeLabel.className = 'category-barcode-label';
          barcodeLabel.textContent = 'BARCODE / ISBN';
          const barcode = document.createElement('code');
          barcode.className = 'category-barcode';
          barcode.textContent = book.barcode;
          const actions = document.createElement('div');
          actions.className = 'category-book-actions';
          const copyButton = document.createElement('button');
          copyButton.type = 'button';
          copyButton.className = 'directory-row-button category-copy-button';
          copyButton.textContent = 'Copy Barcode';
          copyButton.addEventListener('click', async () => {
            try {
              if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(book.barcode);
              } else {
                const temporaryInput = document.createElement('textarea');
                temporaryInput.value = book.barcode;
                temporaryInput.setAttribute('readonly', '');
                temporaryInput.style.position = 'fixed';
                temporaryInput.style.opacity = '0';
                document.body.append(temporaryInput);
                temporaryInput.select();
                const copied = document.execCommand('copy');
                temporaryInput.remove();
                if (!copied) throw new Error('Clipboard copy was not available.');
              }
              categoryMessage.textContent = `Barcode ${book.barcode} copied.`;
            } catch (error) {
              categoryMessage.textContent = 'Could not copy the barcode. Select and copy the displayed number instead.';
            }
          });
          const issueLink = document.createElement('a');
          issueLink.className = 'primary-btn category-issue-button';
          issueLink.href = `checkout.html?barcode=${encodeURIComponent(book.barcode)}`;
          issueLink.textContent = 'Issue Book';
          actions.append(copyButton, issueLink);
          card.append(title, author, barcodeLabel, barcode, actions);
          categoryBookList.append(card);
        });

        categoryModal.classList.add('is-open');
        categoryModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        categoryCloseButton.focus();
      });
      categoryGrid.append(button);
    });

    categoryCloseButton.addEventListener('click', closeCategoryModal);
    categoryModal.addEventListener('click', (event) => {
      if (event.target === categoryModal) closeCategoryModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && categoryModal.classList.contains('is-open')) {
        closeCategoryModal();
      }
    });
  }

  const libraryDirectoryTrigger = document.querySelector('.library-directory-trigger');
  const libraryModal = document.getElementById('library-modal');
  const librarySearch = document.getElementById('library-search');
  const batchFilter = document.getElementById('batch-filter');
  const libraryTableBody = document.getElementById('library-table-body');
  const studentDirectoryForm = document.getElementById('student-directory-form');
  const studentDirectoryMessage = document.getElementById('student-directory-message');
  const libraryModalCloseButton = document.querySelector('.library-modal-close:not(.faculty-modal-close):not(.schedule-modal-close)');
  let libraryData = initialLibraryData.map((student) => ({ ...student }));

  const saveLibraryData = () => {
    try {
      const saved = saveSharedLibraryData(libraryData);
      if (!saved) throw new Error('Student records could not be saved.');
      return saved;
    } catch (error) {
      studentDirectoryMessage.textContent = 'Could not save changes in this browser. Check storage permissions and try again.';
      return false;
    }
  };

  if (libraryTableBody && studentDirectoryForm && studentDirectoryMessage) {
    try {
      libraryData = loadSharedLibraryData();
    } catch (error) {
      studentDirectoryMessage.textContent = 'Saved student data could not be read. Showing the example records instead.';
    }

    const makeTextInput = (value, label) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = value;
      input.setAttribute('aria-label', `Edit ${label}`);
      return input;
    };

    const renderLibraryTable = (searchTerm = '', selectedBatch = '') => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const filtered = libraryData.filter((student) =>
        `${student.name} ${student.roll} ${student.libraryId} ${student.batch} ${student.status}`
          .toLowerCase()
          .includes(normalizedSearch) &&
        (!selectedBatch || student.batch === selectedBatch)
      );
      libraryTableBody.replaceChildren();

      if (!filtered.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.className = 'no-results';
        cell.textContent = 'No matching students found.';
        row.append(cell);
        libraryTableBody.append(row);
        return;
      }

      filtered.forEach((student) => {
        const row = document.createElement('tr');
        row.dataset.studentId = student.id;
        const nameCell = document.createElement('td');
        const rollCell = document.createElement('td');
        const libraryIdCell = document.createElement('td');
        const batchCell = document.createElement('td');
        const statusCell = document.createElement('td');
        const actionsCell = document.createElement('td');

        nameCell.append(makeTextInput(student.name, 'student name'));
        rollCell.append(makeTextInput(student.roll || '', 'roll number'));
        libraryIdCell.append(makeTextInput(student.libraryId, 'library ID'));
        const batchSelect = document.createElement('select');
        batchSelect.className = 'student-batch-select';
        batchSelect.setAttribute('aria-label', 'Edit student batch');
        batchNames.forEach((batch) => {
          const option = document.createElement('option');
          option.value = batch;
          option.textContent = batch;
          option.selected = batch === student.batch;
          batchSelect.append(option);
        });
        batchCell.append(batchSelect);

        const statusSelect = document.createElement('select');
        statusSelect.className = 'student-status-select';
        statusSelect.setAttribute('aria-label', 'Edit student status');
        ['Active', 'Issued', 'Overdue'].forEach((status) => {
          const option = document.createElement('option');
          option.value = status;
          option.textContent = status;
          option.selected = status === student.status;
          statusSelect.append(option);
        });
        statusCell.append(statusSelect);

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'directory-row-button directory-save-button';
        saveButton.textContent = 'Save';
        saveButton.setAttribute('aria-label', `Save changes for ${student.name}`);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'directory-row-button directory-delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('aria-label', `Delete ${student.name}`);

        actionsCell.className = 'directory-actions';
        actionsCell.append(saveButton, deleteButton);
        row.append(nameCell, rollCell, libraryIdCell, batchCell, statusCell, actionsCell);
        libraryTableBody.append(row);
      });
    };

    if (libraryDirectoryTrigger && libraryModal && libraryModalCloseButton) {
      const closeLibraryModal = () => {
        libraryModal.classList.remove('is-open');
        libraryModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        libraryDirectoryTrigger.focus();
      };

      libraryDirectoryTrigger.addEventListener('click', (event) => {
        event.preventDefault();
        libraryModal.classList.add('is-open');
        libraryModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        librarySearch.focus({ preventScroll: true });
      });

      libraryModalCloseButton.addEventListener('click', closeLibraryModal);
      libraryModal.addEventListener('click', (event) => {
        if (event.target === libraryModal) closeLibraryModal();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && libraryModal.classList.contains('is-open')) {
          closeLibraryModal();
        }
      });
    }

    librarySearch.addEventListener('input', () => renderLibraryTable(librarySearch.value, batchFilter.value));
    batchFilter.addEventListener('change', () => renderLibraryTable(librarySearch.value, batchFilter.value));

    studentDirectoryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(studentDirectoryForm);
      const student = {
        id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: formData.get('name').trim(),
        roll: formData.get('roll').trim(),
        libraryId: formData.get('libraryId').trim(),
        batch: formData.get('batch'),
        status: formData.get('status')
      };

      if (!student.name || !/^\d{1,3}$/.test(student.roll) || !student.libraryId || !batchNames.includes(student.batch)) {
        studentDirectoryMessage.textContent = 'Enter a name, roll number of up to three digits, library ID, and select a valid batch.';
        return;
      }
      if (libraryData.some((record) => record.libraryId.toLowerCase() === student.libraryId.toLowerCase())) {
        studentDirectoryMessage.textContent = 'That library ID is already registered.';
        return;
      }

      libraryData.push(student);
      if (!saveLibraryData()) {
        libraryData.pop();
        return;
      }

      studentDirectoryForm.reset();
      librarySearch.value = '';
      batchFilter.value = '';
      studentDirectoryMessage.textContent = `${student.name} added to the directory.`;
      renderLibraryTable();
    });

    libraryTableBody.addEventListener('click', (event) => {
      const row = event.target.closest('tr[data-student-id]');
      if (!row) return;

      const studentIndex = libraryData.findIndex((student) => student.id === row.dataset.studentId);
      if (studentIndex < 0) return;

      if (event.target.matches('.directory-save-button')) {
        const fields = row.querySelectorAll('input');
        const name = fields[0].value.trim();
        const roll = fields[1].value.trim();
        const libraryId = fields[2].value.trim();
        const batch = row.querySelector('.student-batch-select').value;
        const status = row.querySelector('.student-status-select').value;
        if (!name || !/^\d{1,3}$/.test(roll) || !libraryId || !batchNames.includes(batch)) {
          studentDirectoryMessage.textContent = 'Name, a roll number of up to three digits, library ID, and a valid batch are required.';
          return;
        }
        if (libraryData.some((record, index) => index !== studentIndex && record.libraryId.toLowerCase() === libraryId.toLowerCase())) {
          studentDirectoryMessage.textContent = 'That library ID is already assigned to another student.';
          return;
        }

        const previousStudent = libraryData[studentIndex];
        libraryData[studentIndex] = { ...previousStudent, name, roll, libraryId, batch, status };
        if (!saveLibraryData()) {
          libraryData[studentIndex] = previousStudent;
          return;
        }
        studentDirectoryMessage.textContent = `${name} updated.`;
        renderLibraryTable(librarySearch.value, batchFilter.value);
      }

      if (event.target.matches('.directory-delete-button')) {
        const [deletedStudent] = libraryData.splice(studentIndex, 1);
        if (!saveLibraryData()) {
          libraryData.splice(studentIndex, 0, deletedStudent);
          return;
        }
        studentDirectoryMessage.textContent = `${deletedStudent.name} removed from the directory.`;
        renderLibraryTable(librarySearch.value, batchFilter.value);
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key !== libraryStorageKey) return;
      try {
        libraryData = loadSharedLibraryData();
        renderLibraryTable(librarySearch.value, batchFilter.value);
      } catch (error) {
        studentDirectoryMessage.textContent = 'Updated student records could not be read.';
      }
    });

    renderLibraryTable(librarySearch.value, batchFilter.value);
  }

  const facultyDirectoryTrigger = document.querySelector('.faculty-directory-trigger');
  const facultyModal = document.getElementById('faculty-modal');
  const facultyCloseButton = document.querySelector('.faculty-modal-close');

  if (facultyDirectoryTrigger && facultyModal && facultyCloseButton) {
    const closeFacultyModal = () => {
      facultyModal.classList.remove('is-open');
      facultyModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      facultyDirectoryTrigger.focus();
    };

    facultyDirectoryTrigger.addEventListener('click', () => {
      facultyModal.classList.add('is-open');
      facultyModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      facultyCloseButton.focus();
    });

    facultyCloseButton.addEventListener('click', closeFacultyModal);

    facultyModal.addEventListener('click', (event) => {
      if (event.target === facultyModal) {
        closeFacultyModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && facultyModal.classList.contains('is-open')) {
        closeFacultyModal();
      }
    });
  }

  const teacherForm = document.getElementById('teacher-form');
  const facultyGrid = document.getElementById('faculty-grid');
  const teacherFormMessage = document.getElementById('teacher-form-message');

  if (teacherForm && facultyGrid && teacherFormMessage) {
    const showEmptyState = () => {
      if (!facultyGrid.querySelector('.faculty-card')) {
        const emptyState = document.createElement('p');
        emptyState.className = 'faculty-empty-state';
        emptyState.textContent = 'Add a teacher using the form above to see their profile here.';
        facultyGrid.append(emptyState);
      }
    };

    const createTeacherCard = (name, photo) => {
      const card = document.createElement('article');
      card.className = 'faculty-card';
      card.dataset.photoUrl = URL.createObjectURL(photo);

      const image = document.createElement('img');
      image.className = 'faculty-photo';
      image.src = card.dataset.photoUrl;
      image.alt = `${name} photo`;

      const controls = document.createElement('div');
      controls.className = 'faculty-card-controls';

      const nameField = document.createElement('label');
      nameField.className = 'faculty-edit-field';
      nameField.textContent = 'Teacher Name';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'faculty-name-input';
      nameInput.value = name;
      nameInput.setAttribute('aria-label', `Edit name for ${name}`);
      nameField.append(nameInput);

      const photoField = document.createElement('label');
      photoField.className = 'faculty-edit-field';
      photoField.textContent = 'Change Photo';

      const photoInput = document.createElement('input');
      photoInput.type = 'file';
      photoInput.accept = 'image/*';
      photoInput.className = 'faculty-photo-input';
      photoInput.setAttribute('aria-label', `Change photo for ${name}`);
      photoField.append(photoInput);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'faculty-delete-button';
      deleteButton.textContent = 'Delete Teacher';
      deleteButton.setAttribute('aria-label', `Delete ${name}`);

      controls.append(nameField, photoField, deleteButton);
      card.append(image, controls);
      facultyGrid.append(card);
      return card;
    };

    teacherForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameInput = document.getElementById('teacher-name');
      const photoInput = document.getElementById('teacher-photo');
      const name = nameInput.value.trim();
      const photo = photoInput.files[0];

      if (!name || !photo) {
        teacherFormMessage.textContent = 'Enter a teacher name and choose a photo.';
        return;
      }

      if (!photo.type.startsWith('image/')) {
        teacherFormMessage.textContent = 'Choose a valid image file.';
        photoInput.value = '';
        return;
      }

      facultyGrid.querySelector('.faculty-empty-state')?.remove();
      createTeacherCard(name, photo);

      teacherForm.reset();
      teacherFormMessage.textContent = `${name} added to the teacher list.`;
      nameInput.focus();
    });

    facultyGrid.addEventListener('input', (event) => {
      if (!event.target.matches('.faculty-name-input')) return;

      const card = event.target.closest('.faculty-card');
      if (card) {
        card.querySelector('.faculty-photo').alt = `${event.target.value.trim() || 'Teacher'} photo`;
        event.target.setAttribute('aria-label', `Edit name for ${event.target.value.trim() || 'teacher'}`);
      }
    });

    facultyGrid.addEventListener('change', (event) => {
      if (!event.target.matches('.faculty-photo-input')) return;

      const photoInput = event.target;
      const photo = photoInput.files[0];
      const card = photoInput.closest('.faculty-card');
      if (!photo || !card) return;

      if (!photo.type.startsWith('image/')) {
        teacherFormMessage.textContent = 'Choose a valid image file.';
        photoInput.value = '';
        return;
      }

      const image = card.querySelector('.faculty-photo');
      const previousUrl = card.dataset.photoUrl;
      const nextUrl = URL.createObjectURL(photo);
      image.src = nextUrl;
      card.dataset.photoUrl = nextUrl;
      image.alt = `${card.querySelector('.faculty-name-input').value.trim() || 'Teacher'} photo`;
      if (previousUrl) URL.revokeObjectURL(previousUrl);

      teacherFormMessage.textContent = 'Teacher photo updated.';
      photoInput.value = '';
    });

    facultyGrid.addEventListener('click', (event) => {
      const deleteButton = event.target.closest('.faculty-delete-button');
      if (!deleteButton) return;

      const card = deleteButton.closest('.faculty-card');
      if (!card) return;

      const name = card.querySelector('.faculty-name-input').value.trim();
      if (card.dataset.photoUrl) URL.revokeObjectURL(card.dataset.photoUrl);
      card.remove();
      showEmptyState();
      teacherFormMessage.textContent = `${name || 'Teacher'} removed from the list.`;
    });
  }

  const scheduleDirectoryTrigger = document.querySelector('.schedule-directory-trigger');
  const scheduleModal = document.getElementById('schedule-modal');
  const scheduleCloseButton = document.querySelector('.schedule-modal-close');

  if (scheduleDirectoryTrigger && scheduleModal && scheduleCloseButton) {
    const closeScheduleModal = () => {
      scheduleModal.classList.remove('is-open');
      scheduleModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      scheduleDirectoryTrigger.focus();
    };

    scheduleDirectoryTrigger.addEventListener('click', () => {
      scheduleModal.classList.add('is-open');
      scheduleModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      scheduleCloseButton.focus();
    });

    scheduleCloseButton.addEventListener('click', closeScheduleModal);

    scheduleModal.addEventListener('click', (event) => {
      if (event.target === scheduleModal) {
        closeScheduleModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && scheduleModal.classList.contains('is-open')) {
        closeScheduleModal();
      }
    });
  }

  const studentForm = document.querySelector('.student-form');
  if (studentForm) {
    const setSummary = () => {
      const name = document.getElementById('student-name')?.value.trim() || 'Not entered';
      let roll = document.getElementById('student-roll')?.value.trim() || 'Not entered';
      let libraryNo = document.getElementById('library-number')?.value.trim() || 'Not entered';

      roll = roll.replace(/\D/g, '').slice(0, 3) || 'Not entered';
      libraryNo = libraryNo.replace(/\D/g, '').slice(0, 5) || 'Not entered';

      const summaryValues = document.querySelectorAll('.summary-card li strong');
      if (summaryValues.length >= 3) {
        summaryValues[0].textContent = name;
        summaryValues[1].textContent = roll;
        summaryValues[2].textContent = libraryNo;
      }
    };

    studentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('student-name').value.trim();
      let roll = document.getElementById('student-roll').value.trim().replace(/\D/g, '').slice(0, 3);
      let libraryNo = document.getElementById('library-number').value.trim().replace(/\D/g, '').slice(0, 5);
      const message = document.querySelector('.form-message');

      if (!name || !roll || !libraryNo) {
        if (message) {
          message.textContent = 'Please enter valid student name, roll number, and library number.';
        }
        return;
      }

      document.getElementById('student-roll').value = roll;
      document.getElementById('library-number').value = libraryNo;
      setSummary();

      let students;
      try {
        students = loadSharedLibraryData();
      } catch (error) {
        if (message) message.textContent = 'Saved student records could not be read.';
        return;
      }
      const libraryId = `LD-${libraryNo}`;
      if (students.some((student) => student.libraryId.toLowerCase() === libraryId.toLowerCase())) {
        if (message) message.textContent = 'That library number is already registered.';
        return;
      }
      students.push({
        id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        roll,
        libraryId,
        batch: 'Batch 1',
        status: 'Active'
      });
      if (!saveSharedLibraryData(students)) {
        if (message) message.textContent = 'Could not save this student. Check browser storage and try again.';
        return;
      }

      if (message) {
        message.textContent = `Student saved: ${name} | Roll No: ${roll} | Library No: ${libraryNo}`;
      }
    });

    studentForm.addEventListener('input', (event) => {
      const target = event.target;
      if (target.id === 'student-roll') {
        target.value = target.value.replace(/\D/g, '').slice(0, 3);
      }
      if (target.id === 'library-number') {
        target.value = target.value.replace(/\D/g, '').slice(0, 5);
      }
      setSummary();
    });
  }

  const checkinTableBody = document.getElementById('checkin-table-body');
  const checkinMessage = document.getElementById('checkin-message');

  if (checkinTableBody && checkinMessage) {
    const storageKey = 'alathurpadi-library-borrowed-books';
    const initialBorrowedBooks = [
      { id: 'borrowed-1', studentName: 'Aisha Rahman', libraryId: 'LD-2014', bookNumber: 'BK-100318', bookName: 'Foundations of Physics', issuedDate: '2026-10-20' },
      { id: 'borrowed-2', studentName: 'Muhammed Yasin', libraryId: 'LD-2048', bookNumber: 'BK-100245', bookName: 'Algebra Basics', issuedDate: '2026-10-22' },
      { id: 'borrowed-3', studentName: 'Fathima Noor', libraryId: 'LD-2091', bookNumber: 'BK-100412', bookName: 'The World of Science', issuedDate: '2026-10-24' },
      { id: 'borrowed-4', studentName: 'Abdul Kareem', libraryId: 'LD-2117', bookNumber: 'BK-100587', bookName: 'A Short History of Kerala', issuedDate: '2026-10-26' },
      { id: 'borrowed-5', studentName: 'Hana Fathima', libraryId: 'LD-2184', bookNumber: 'BK-100632', bookName: 'English Reader', issuedDate: '2026-10-28' }
    ];
    let borrowedBooks = initialBorrowedBooks.map(enrichBorrowedBook);
    let editingBookId = null;

    const addDays = (date, days) => {
      const result = new Date(`${date}T00:00:00Z`);
      result.setUTCDate(result.getUTCDate() + days);
      return result.toISOString().slice(0, 10);
    };

    const formatDate = (date) => new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(`${date}T00:00:00Z`));

    const showCheckinMessage = (message) => {
      checkinMessage.textContent = message;
    };

    const saveBorrowedBooks = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(borrowedBooks));
        return true;
      } catch (error) {
        showCheckinMessage('Could not save changes in this browser. Check storage permissions and try again.');
        return false;
      }
    };

    try {
      const savedBooks = localStorage.getItem(storageKey);
      if (savedBooks !== null) {
        const parsedBooks = JSON.parse(savedBooks);
        if (!Array.isArray(parsedBooks) || parsedBooks.some((book) =>
          !book ||
          typeof book.id !== 'string' ||
          typeof book.studentName !== 'string' ||
          typeof book.libraryId !== 'string' ||
          typeof book.bookNumber !== 'string' ||
          typeof book.bookName !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(book.issuedDate) ||
          Number.isNaN(Date.parse(`${book.issuedDate}T00:00:00Z`))
        )) {
          throw new Error('Saved borrowing records are invalid.');
        }
        borrowedBooks = parsedBooks.map(enrichBorrowedBook);
      }
    } catch (error) {
      borrowedBooks = initialBorrowedBooks.map(enrichBorrowedBook);
      showCheckinMessage('Saved borrowing records could not be read. Showing the example records instead.');
    }

    const createActionButton = (text, className, label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `directory-row-button ${className}`;
      button.textContent = text;
      button.setAttribute('aria-label', label);
      return button;
    };

    const getVisibleBorrowedBooks = () => {
      const studentFilter = new URLSearchParams(window.location.search).get('student');
      if (!studentFilter) return borrowedBooks;
      const normalizedFilter = studentFilter.trim().toLowerCase();
      return borrowedBooks.filter((book) => {
        const text = `${book.studentName} ${book.libraryId}`.toLowerCase();
        return text.includes(normalizedFilter);
      });
    };

    const renderBorrowedBooks = () => {
      checkinTableBody.replaceChildren();
      const visibleBorrowedBooks = getVisibleBorrowedBooks();

      if (!visibleBorrowedBooks.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 10;
        cell.className = 'no-results';
        const filterValue = new URLSearchParams(window.location.search).get('student');
        cell.textContent = filterValue ? 'No books are currently issued to this student.' : 'No books are currently awaiting return.';
        row.append(cell);
        checkinTableBody.append(row);
        return;
      }

      visibleBorrowedBooks.forEach((book) => {
        const row = document.createElement('tr');
        row.dataset.borrowedBookId = book.id;
        const isEditing = editingBookId === book.id;
        const values = [book.studentName, book.libraryId, book.batch, book.bookNumber, book.bookName, book.category, book.author];

        values.forEach((value, index) => {
          const cell = document.createElement('td');
          if (isEditing) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            const fields = ['studentName', 'libraryId', 'batch', 'bookNumber', 'bookName', 'category', 'author'];
            const labels = ['student name', 'library ID', 'batch', 'book number', 'book name', 'category', 'author'];
            input.dataset.field = fields[index];
            input.setAttribute('aria-label', `Edit ${labels[index]}`);
            if (['batch', 'bookName', 'category', 'author'].includes(fields[index])) input.readOnly = true;
            cell.append(input);
          } else {
            cell.textContent = value;
          }
          row.append(cell);
        });

        const issuedDateCell = document.createElement('td');
        if (isEditing) {
          const dateInput = document.createElement('input');
          dateInput.type = 'date';
          dateInput.value = book.issuedDate;
          dateInput.dataset.field = 'issuedDate';
          dateInput.setAttribute('aria-label', 'Edit issued date');
          issuedDateCell.append(dateInput);
        } else {
          issuedDateCell.textContent = formatDate(book.issuedDate);
        }
        row.append(issuedDateCell);

        const dueDateCell = document.createElement('td');
        dueDateCell.textContent = formatDate(addDays(book.issuedDate, 14));
        dueDateCell.className = 'checkin-due-date';
        row.append(dueDateCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'directory-actions';
        if (isEditing) {
          actionsCell.append(
            createActionButton('Save', 'directory-save-button', `Save changes for ${book.bookName}`),
            createActionButton('Cancel', 'checkin-cancel-button', `Cancel editing ${book.bookName}`)
          );
        } else {
          actionsCell.append(
            createActionButton('Edit', 'checkin-edit-button', `Edit ${book.bookName}`),
            createActionButton('Return', 'checkin-return-button', `Record return for ${book.bookName}`)
          );
        }
        row.append(actionsCell);
        checkinTableBody.append(row);
      });
    };

    checkinTableBody.addEventListener('input', (event) => {
      const input = event.target;
      const row = input.closest('tr');
      if (input.dataset.field === 'bookNumber') {
        const inventoryBook = findInventoryBook(input.value);
        const message = inventoryBook
          ? `${inventoryBook.bookName} found in inventory.`
          : 'Book record not found in inventory.';
        showCheckinMessage(message);
        row.querySelector('[data-field="bookName"]').value = inventoryBook ? inventoryBook.bookName : '';
        row.querySelector('[data-field="category"]').value = inventoryBook ? inventoryBook.category : '';
        row.querySelector('[data-field="author"]').value = inventoryBook ? inventoryBook.author : '';
      }
      if (input.dataset.field === 'issuedDate') {
        const dueDateCell = row.querySelector('.checkin-due-date');
        dueDateCell.textContent = input.value && !Number.isNaN(Date.parse(`${input.value}T00:00:00Z`))
          ? formatDate(addDays(input.value, 14))
          : 'Select an issued date';
      }
    });

    checkinTableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      const row = button && button.closest('tr[data-borrowed-book-id]');
      if (!row) return;

      const bookIndex = borrowedBooks.findIndex((book) => book.id === row.dataset.borrowedBookId);
      if (bookIndex < 0) return;

      if (button.classList.contains('checkin-edit-button')) {
        editingBookId = row.dataset.borrowedBookId;
        renderBorrowedBooks();
        return;
      }

      if (button.classList.contains('checkin-cancel-button')) {
        editingBookId = null;
        renderBorrowedBooks();
        showCheckinMessage('Changes discarded.');
        return;
      }

      if (button.classList.contains('directory-save-button')) {
        const updatedBook = { ...borrowedBooks[bookIndex] };
        row.querySelectorAll('[data-field]').forEach((input) => {
          updatedBook[input.dataset.field] = input.value.trim();
        });
        if (
          !updatedBook.studentName ||
          !updatedBook.libraryId ||
          !updatedBook.bookNumber ||
          !findInventoryBook(updatedBook.bookNumber) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(updatedBook.issuedDate) ||
          Number.isNaN(Date.parse(`${updatedBook.issuedDate}T00:00:00Z`))
        ) {
          showCheckinMessage('Enter valid values for every field, including the issued date.');
          return;
        }

        Object.assign(updatedBook, findInventoryBook(updatedBook.bookNumber));
        const previousBook = borrowedBooks[bookIndex];
        borrowedBooks[bookIndex] = updatedBook;
        if (!saveBorrowedBooks()) {
          borrowedBooks[bookIndex] = previousBook;
          return;
        }
        editingBookId = null;
        renderBorrowedBooks();
        showCheckinMessage(`${updatedBook.bookName} updated. Its due date is two weeks after the issued date.`);
        return;
      }

      if (button.classList.contains('checkin-return-button')) {
        const [returnedBook] = borrowedBooks.splice(bookIndex, 1);
        const returnedBooksKey = 'alathurpadi-library-returned-books';
        let returnedBooks;
        try {
          returnedBooks = JSON.parse(localStorage.getItem(returnedBooksKey) || '[]');
          if (!Array.isArray(returnedBooks)) throw new Error('Returned book records must be a list.');
          const returnedAt = new Date().toISOString();
          const fineDetails = getFineDetails({ ...returnedBook, returnedAt });
          returnedBooks.push({
            ...returnedBook,
            returnedAt,
            ...fineDetails,
            paymentStatus: fineDetails.fineAmount ? 'Unpaid' : 'No Fine'
          });
          localStorage.setItem(returnedBooksKey, JSON.stringify(returnedBooks));
        } catch (error) {
          borrowedBooks.splice(bookIndex, 0, returnedBook);
          showCheckinMessage('Could not save this return. Check browser storage and try again.');
          return;
        }

        if (!saveBorrowedBooks()) {
          borrowedBooks.splice(bookIndex, 0, returnedBook);
          returnedBooks.pop();
          try {
            localStorage.setItem(returnedBooksKey, JSON.stringify(returnedBooks));
          } catch (error) {
            showCheckinMessage('Return could not be completed, and the return history could not be restored. Check browser storage.');
          }
          return;
        }
        syncStudentCirculationStatus(returnedBook.libraryId, borrowedBooks);
        editingBookId = null;
        renderBorrowedBooks();
        showCheckinMessage(`${returnedBook.bookName} marked as returned.`);
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey) return;
      try {
        const changedBooks = JSON.parse(event.newValue || '[]');
        if (!Array.isArray(changedBooks) || changedBooks.some((book) =>
          !book ||
          typeof book.id !== 'string' ||
          typeof book.studentName !== 'string' ||
          typeof book.libraryId !== 'string' ||
          typeof book.bookNumber !== 'string' ||
          typeof book.bookName !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(book.issuedDate) ||
          Number.isNaN(Date.parse(`${book.issuedDate}T00:00:00Z`))
        )) {
          throw new Error('Updated borrowing records are invalid.');
        }
        borrowedBooks = changedBooks.map(enrichBorrowedBook);
        editingBookId = null;
        renderBorrowedBooks();
        showCheckinMessage('Borrowing records updated.');
      } catch (error) {
        showCheckinMessage('Updated borrowing records could not be read.');
      }
    });

    renderBorrowedBooks();
  }

  const checkoutForm = document.getElementById('checkout-form');
  const checkoutStudentId = document.getElementById('checkout-student-id');
  const checkoutStudentDetails = document.getElementById('checkout-student-details');
  const checkoutMessage = document.getElementById('checkout-message');
  const checkoutBookNumber = document.getElementById('checkout-book-number');
  const checkoutBookName = document.getElementById('checkout-book-name');
  const checkoutCategory = document.getElementById('checkout-category');
  const checkoutAuthor = document.getElementById('checkout-author');

  if (checkoutForm && checkoutStudentId && checkoutStudentDetails && checkoutMessage && checkoutBookNumber && checkoutBookName && checkoutCategory && checkoutAuthor) {
    const borrowedBooksKey = 'alathurpadi-library-borrowed-books';
    const studentsKey = 'alathurpadi-library-students';
    const initialBorrowedBooks = [
      { id: 'borrowed-1', studentName: 'Aisha Rahman', libraryId: 'LD-2014', bookNumber: 'BK-100318', bookName: 'Foundations of Physics', issuedDate: '2026-10-20' },
      { id: 'borrowed-2', studentName: 'Muhammed Yasin', libraryId: 'LD-2048', bookNumber: 'BK-100245', bookName: 'Algebra Basics', issuedDate: '2026-10-22' },
      { id: 'borrowed-3', studentName: 'Fathima Noor', libraryId: 'LD-2091', bookNumber: 'BK-100412', bookName: 'The World of Science', issuedDate: '2026-10-24' },
      { id: 'borrowed-4', studentName: 'Abdul Kareem', libraryId: 'LD-2117', bookNumber: 'BK-100587', bookName: 'A Short History of Kerala', issuedDate: '2026-10-26' },
      { id: 'borrowed-5', studentName: 'Hana Fathima', libraryId: 'LD-2184', bookNumber: 'BK-100632', bookName: 'English Reader', issuedDate: '2026-10-28' }
    ];
    const defaultStudents = initialBorrowedBooks.map(({ studentName, libraryId }, index) => ({
      id: `student-${index + 1}`,
      name: studentName,
      libraryId,
      batch: 'Batch 1'
    }));

    let students = defaultStudents;
    let selectedStudent = null;

    const showCheckoutMessage = (message) => {
      checkoutMessage.textContent = message;
    };

    const loadStudents = (showError = true) => {
      try {
        students = loadSharedLibraryData();
      } catch (error) {
        students = defaultStudents;
        if (showError) showCheckoutMessage('Student records could not be read. Showing the example students.');
      }

      return students;
    };

    const lookupCheckoutStudent = () => {
      const enteredId = checkoutStudentId.value.trim().toUpperCase();
      selectedStudent = enteredId
        ? students.find((student) =>
          student.libraryId.trim().toUpperCase() === enteredId ||
          student.id.trim().toUpperCase() === enteredId
        ) || null
        : null;

      if (selectedStudent) {
        checkoutStudentDetails.textContent = `${selectedStudent.name} — ${selectedStudent.batch}`;
        checkoutStudentDetails.classList.remove('is-not-found');
        showCheckoutMessage('Student found. Confirm the name and batch before issuing.');
      } else {
        checkoutStudentDetails.textContent = enteredId
          ? 'Student record not found. Check the ID or register the student first.'
          : 'Student details will appear here after a valid ID is entered.';
        checkoutStudentDetails.classList.toggle('is-not-found', Boolean(enteredId));
        if (enteredId) showCheckoutMessage('Student ID / number not found.');
        else showCheckoutMessage('');
      }

      return selectedStudent;
    };

    const getIssueDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const readBorrowedBooks = () => {
      const savedBooks = localStorage.getItem(borrowedBooksKey);
      if (savedBooks === null) return initialBorrowedBooks.map(enrichBorrowedBook);
      const parsedBooks = JSON.parse(savedBooks);
      if (!Array.isArray(parsedBooks) || parsedBooks.some((book) =>
        !book ||
        typeof book.id !== 'string' ||
        typeof book.studentName !== 'string' ||
        typeof book.libraryId !== 'string' ||
        typeof book.bookNumber !== 'string' ||
        typeof book.bookName !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(book.issuedDate) ||
        Number.isNaN(Date.parse(`${book.issuedDate}T00:00:00Z`))
      )) {
        throw new Error('Saved borrowing records are invalid.');
      }
      return parsedBooks.map(enrichBorrowedBook);
    };

    const lookupCheckoutBook = () => {
      const inventoryBook = findInventoryBook(checkoutBookNumber.value);
      if (!inventoryBook) {
        checkoutBookName.value = '';
        checkoutCategory.value = '';
        checkoutAuthor.value = '';
        showCheckoutMessage(checkoutBookNumber.value.trim() ? 'Book record not found in inventory.' : '');
        return null;
      }

      checkoutBookNumber.value = inventoryBook.bookNumber;
      checkoutBookName.value = inventoryBook.bookName;
      checkoutCategory.value = inventoryBook.category;
      checkoutAuthor.value = inventoryBook.author;
      showCheckoutMessage(`${inventoryBook.bookName} found in inventory.`);
      return inventoryBook;
    };

    checkoutBookNumber.addEventListener('input', lookupCheckoutBook);
    checkoutBookNumber.addEventListener('change', lookupCheckoutBook);
    const requestedBarcode = new URLSearchParams(window.location.search).get('barcode');
    if (requestedBarcode) {
      checkoutBookNumber.value = requestedBarcode;
      lookupCheckoutBook();
    }

    loadStudents();
    checkoutStudentId.addEventListener('input', lookupCheckoutStudent);
    checkoutStudentId.addEventListener('change', lookupCheckoutStudent);
    const requestedStudent = new URLSearchParams(window.location.search).get('student');
    if (requestedStudent) {
      checkoutStudentId.value = requestedStudent;
      lookupCheckoutStudent();
    }
    window.addEventListener('storage', (event) => {
      if (event.key === studentsKey) {
        loadStudents();
        lookupCheckoutStudent();
      }
    });

    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      selectedStudent = lookupCheckoutStudent();
      const inventoryBook = lookupCheckoutBook();
      if (
        !selectedStudent ||
        !inventoryBook
      ) {
        if (!selectedStudent && !inventoryBook) showCheckoutMessage('Student ID / number not found and book record not found in inventory.');
        else if (!selectedStudent) showCheckoutMessage('Student ID / number not found.');
        else showCheckoutMessage('Book record not found in inventory.');
        return;
      }

      const bookNumber = inventoryBook.bookNumber;
      let borrowedBooks;
      try {
        borrowedBooks = readBorrowedBooks();
      } catch (error) {
        showCheckoutMessage('Saved borrowing records could not be read. No checkout was recorded.');
        return;
      }
      if (borrowedBooks.some((book) => book.bookNumber.toLowerCase() === bookNumber.toLowerCase())) {
        showCheckoutMessage('That book number is already checked out.');
        return;
      }

      const newLoan = {
        id: `borrowed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        studentName: selectedStudent.name,
        libraryId: selectedStudent.libraryId,
        batch: selectedStudent.batch,
        bookNumber,
        bookName: inventoryBook.bookName,
        category: inventoryBook.category,
        author: inventoryBook.author,
        issuedDate: getIssueDate()
      };
      borrowedBooks.push(newLoan);
      try {
        localStorage.setItem(borrowedBooksKey, JSON.stringify(borrowedBooks));
      } catch (error) {
        showCheckoutMessage('Could not save the checkout. Check browser storage and try again.');
        return;
      }
      syncStudentCirculationStatus(selectedStudent.libraryId, borrowedBooks);

      checkoutForm.elements.bookNumber.value = '';
      checkoutForm.elements.bookName.value = '';
      checkoutStudentId.value = '';
      selectedStudent = null;
      checkoutStudentDetails.textContent = 'Student details will appear here after a valid ID is entered.';
      showCheckoutMessage(`${newLoan.bookName} issued to ${newLoan.studentName}. It is now listed in Check In.`);
    });
  }

  const fineList = document.getElementById('fine-list');
  const fineMessage = document.getElementById('fine-message');
  if (fineList && fineMessage) {
    const returnedBooksKey = 'alathurpadi-library-returned-books';

    const renderFines = () => {
      fineList.replaceChildren();
      try {
        const returnedBooks = JSON.parse(localStorage.getItem(returnedBooksKey) || '[]');
        if (!Array.isArray(returnedBooks)) throw new Error('Fine records must be a list.');
        const fines = returnedBooks
          .map((book) => ({ book, ...getFineDetails(book) }))
          .filter(({ fineAmount }) => fineAmount > 0);

        if (!fines.length) {
          const emptyState = document.createElement('p');
          emptyState.className = 'fine-empty-state';
          emptyState.textContent = 'No late-return fines have been recorded.';
          fineList.append(emptyState);
          fineMessage.textContent = '';
          return;
        }

        fines.forEach(({ book, lateDays, fineAmount }) => {
          const record = document.createElement('article');
          record.className = 'fine-record';
          const details = document.createElement('div');
          details.className = 'fine-record-details';
          const studentName = document.createElement('h2');
          studentName.textContent = book.studentName;
          const studentInfo = document.createElement('p');
          studentInfo.textContent = `${book.libraryId} · ${book.batch || 'Batch 1'}`;
          const bookInfo = document.createElement('p');
          bookInfo.textContent = `${book.bookName} (${book.bookNumber})`;
          const lateInfo = document.createElement('p');
          lateInfo.textContent = `${lateDays} late ${lateDays === 1 ? 'day' : 'days'}`;
          details.append(studentName, studentInfo, bookInfo, lateInfo);

          const payment = document.createElement('div');
          payment.className = 'fine-record-payment';
          const amount = document.createElement('strong');
          amount.textContent = `₹${fineAmount}`;
          const status = document.createElement('span');
          const isPaid = book.paymentStatus === 'Paid';
          status.className = isPaid ? 'fine-paid' : 'fine-unpaid';
          status.textContent = isPaid ? 'Paid' : 'Unpaid';
          payment.append(amount, status);

          if (!isPaid) {
            const paidButton = document.createElement('button');
            paidButton.type = 'button';
            paidButton.className = 'directory-row-button';
            paidButton.textContent = 'Mark Paid';
            paidButton.addEventListener('click', () => {
              try {
                const currentBooks = JSON.parse(localStorage.getItem(returnedBooksKey) || '[]');
                const currentBook = currentBooks.find((item) => item.id === book.id);
                if (!currentBook) throw new Error('Fine record not found.');
                currentBook.paymentStatus = 'Paid';
                localStorage.setItem(returnedBooksKey, JSON.stringify(currentBooks));
                renderFines();
              } catch (error) {
                fineMessage.textContent = 'Could not update payment status. Check browser storage and try again.';
              }
            });
            payment.append(paidButton);
          }

          record.append(details, payment);
          fineList.append(record);
        });
        fineMessage.textContent = `${fines.length} late-return ${fines.length === 1 ? 'fine' : 'fines'} recorded.`;
      } catch (error) {
        fineMessage.textContent = 'Saved fine records could not be read.';
      }
    };

    window.addEventListener('storage', (event) => {
      if (event.key === returnedBooksKey) renderFines();
    });
    renderFines();
  }
});
