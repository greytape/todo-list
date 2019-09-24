document.addEventListener('DOMContentLoaded', function() {
  let templateManager = {
    getTemplateSources: function() {
      this.main_template_source = document.querySelector('#main_template').innerHTML;
      this.item_partial_source = document.querySelector('#item_partial').innerHTML;
      this.list_template_source = document.querySelector('#list_template').innerHTML;
      this.all_todos_template_source = document.querySelector('#all_todos_template').innerHTML;
      this.completed_todos_template_source = document.querySelector('#completed_todos_template').innerHTML;
      this.all_list_template_source = document.querySelector('#all_list_template').innerHTML;
      this.completed_list_template_source = document.querySelector('#completed_list_template').innerHTML;
      this.title_template_source = document.querySelector('#title_template').innerHTML;  
    },
    compileTemplates: function() {
      this.main_template =  Handlebars.compile(this.main_template_source);
      this.item_partial = Handlebars.compile(this.item_partial_source);
      this.list_template = Handlebars.compile(this.list_template_source);
      this.all_todos_template = Handlebars.compile(this.all_todos_template_source);
      this.completed_todos_template = Handlebars.compile(this.completed_todos_template_source);
      this.all_list_template = Handlebars.compile(this.all_list_template_source);
      this.completed_list_template = Handlebars.compile(this.completed_list_template_source);
      this.title_template = Handlebars.compile(this.title_template_source);
    },
    registerPartials: function() {
      Handlebars.registerPartial('item_partial', this.item_partial);
      Handlebars.registerPartial('list_template', this.list_template);
      Handlebars.registerPartial('all_todos_template', this.all_todos_template);
      Handlebars.registerPartial('completed_todos_template', this.completed_todos_template);
      Handlebars.registerPartial('all_list_template', this.all_list_template);
      Handlebars.registerPartial('completed_list_template', this.completed_list_template);
      Handlebars.registerPartial('title_template', this.title_template);
    },

    init: function() {
      this.getTemplateSources();
      this.compileTemplates();
      this.registerPartials();
    },
  };



  listManager = {
    addTodoOnServer: function(todo) {
      let request = new XMLHttpRequest();
      request.open('POST', 'http://localhost:3000/api/todos');
      request.setRequestHeader('Content-Type', 'application/json');
      request.addEventListener('load', this.retrieveAllTodos);
      request.send(JSON.stringify(todo));
    },

    deleteTodo: function(id) {
      let request = new XMLHttpRequest();
      request.open('DELETE', `http://localhost:3000/api/todos/${id}`);
      request.addEventListener('load', this.retrieveAllTodos);
      request.send();
    },

    removeDueDates: function() {
      this.todos.forEach(function(todo) {
        delete todo.due_date;
      });
    },

    retrieveAllTodos: function() {
      let request = new XMLHttpRequest();
      request.open('GET', 'http://localhost:3000/api/todos');
      request.responseType = 'json';
      request.addEventListener('load', function() {
        listManager.todos = request.response;
        listManager.updateAllTodoLists();
      });
      request.send();
    },

    setCurrentlyEditing: function(id) {
      this.currently_editing = this.todos.filter(todo => todo.id === id)[0];
    },

    setSelected: function() {
      let monthYear = this.current_section.monthYear;
      let isCompleted = this.current_section.isCompleted;
      if (monthYear === 'all' && isCompleted) {
        this.selected = this.done_todos;
      } else if (monthYear === 'all' && !isCompleted) {
        this.selected = this.todos;
      } else if (monthYear !== 'all' && isCompleted) {
        this.selected = this.done_todos_by_date[monthYear];
      } else if (monthYear !== 'all' && !isCompleted) {
        this.selected = this.todos_by_date[monthYear];
      }
      if (!this.selected) {
        this.setCurrentSection('all', false);
        this.selected = this.done_todos;
      }
      this.selected = this.selected.sort(this.sortSelected);
      this.current_section.data = this.selected.length;
    },

    setCurrentSection: function(
      monthYear = this.current_section.monthYear, 
      isCompleted = this.current_section.isCompleted
      ) {
      if (monthYear === 'all') {
        if (isCompleted) {
          this.current_section.title = 'Completed Todos';
        } else {
          this.current_section.title = 'All Todos';
        }   
      } else {
        this.current_section.title = monthYear;
      }
      this.current_section.isCompleted = isCompleted;
      this.current_section.monthYear = monthYear;    
    },

    setDueDates: function() {
      this.todos.forEach(function(todo) {
        if (todo.month !== "00" && todo.year !== "0000") {
          todo.due_date = `${todo.month}/${todo.year.slice(-2)}`;
        } else {
          todo.due_date = 'No Due Date';
        }
      });
    },

    sortSelected: function(todoA,todoB) {
      if (todoA.completed && todoB.completed) {
        return 0;
      } else if (todoA.completed) {
        return 1;
      } else if (todoB.completed) {
        return -1;
      } else {
        return 0;
      }
    },

    toggleComplete: function(isToggle) {
      if (isToggle) {
        this.currently_editing.completed = !this.currently_editing.completed;  
      } else {
        this.currently_editing.completed = true;  
      }
      this.updateTodoOnServer(this.currently_editing);
      this.currently_editing = false;
    },

    updateAllTodoLists: function() {
      this.setDueDates();
      this.done_todos = this.todos.filter(todo => todo.completed);
      this.updateTodosByDateList();
      this.updateDoneTodosByDateList();
      this.setCurrentSection();
      this.setSelected();
      pageManager.renderPage();
      this.removeDueDates();
    },

    updateDoneTodosByDateList: function() {
      this.done_todos_by_date = {};
      Object.keys(this.todos_by_date).forEach(function(key) {
        let completed_todos = this.todos_by_date[key].filter(todo => todo.completed);
        if (completed_todos.length > 0) {
          this.done_todos_by_date[key] = completed_todos;
        }
      }, this);
    },

    updateTodoOnServer: function(todo) {
      let request = new XMLHttpRequest();
      request.open('PUT', `http://localhost:3000/api/todos/${todo.id}`);
      request.setRequestHeader('Content-Type', 'application/json');
      request.addEventListener('load', function() {
        listManager.retrieveAllTodos();
      });
      request.send(JSON.stringify(todo));
      this.currently_editing = false;
    },

    updateTodosByDateList: function() {
      this.todos_by_date = {};
      this.todos.forEach(function(todo) {
        let monthYear;
        if (todo.month === '00' || todo.year === '0000') {
          monthYear = 'No Due Date';
        } else {
          monthYear = `${todo.month}/${todo.year.slice(-2)}`;
        }
        if (this.todos_by_date[monthYear]) {
          this.todos_by_date[monthYear].push(todo);
        } else {
          this.todos_by_date[monthYear] = [todo];
        }
      }, this);
    },

    init: function() {
      this.current_section = {monthYear: 'all', isCompleted: false, title: 'All Todos', data: 0};
      this.currently_editing = false;
      this.done_todos = [];
      this.done_todos_by_date = {};
      this.latest_id = {};
      this.selected = [];
      this.todos = [];
      this.todos_by_date = {};
      this.retrieveAllTodos();
    },
  };



  let pageManager = {
    changeTodoValues: function(todo, formElements) {
      if (formElements.form_title) {todo.title = formElements.form_title.value;}
      todo.day = formElements.due_day.value;
      todo.month = formElements.due_month.value;
      todo.year = formElements.due_year.value;
      if (formElements.description.value) {todo.description = formElements.description.value;}
      return todo;
    },

    populateFormModal: function() {
      document.querySelector('#form_title').value = listManager.currently_editing.title;
      document.querySelector('#description').value = listManager.currently_editing.description;
      Array.from(document.querySelector('#due_year').children).filter(function(option) {
          return option.value === listManager.currently_editing.year;
        })[0].selected = true;  
      Array.from(document.querySelector('#due_month').children).filter(function(option) {
          return option.value === listManager.currently_editing.month;
        })[0].selected = true;
      Array.from(document.querySelector('#due_day').children).filter(function(option) {
          return option.value === listManager.currently_editing.day;
        })[0].selected = true;
    },

    renderPage: function() {
      document.body.innerHTML = templateManager.main_template(listManager);
      eventManager.addAllEventListeners();
      this.setActiveElement();
    },

    setActiveElement: function() {
      if (listManager.current_section.isCompleted) {
        document.querySelector(`[data-title="${listManager.current_section.title}"].completed_list`).classList.add('active');  
      } else {
        document.querySelector(`[data-title="${listManager.current_section.title}"]`).classList.add('active');
      }
    },

    submitForm: function() {
      let formElements = this.elements;
      let newTodo;
      if (listManager.currently_editing) {
        newTodo = pageManager.changeTodoValues(listManager.currently_editing, formElements);
        listManager.updateTodoOnServer(newTodo);
      } else {
        newTodo = pageManager.changeTodoValues({}, formElements);
        listManager.setCurrentSection('all', false);
        listManager.addTodoOnServer(newTodo);
      }
      pageManager.toggleShowFormModal();
    },

    toggleShowFormModal: function() {
      document.querySelector('#modal_layer').classList.toggle('hidden');
      document.querySelector('#form_modal').classList.toggle('hidden');
    },

    init: function() {
      this.setActiveElement(document.querySelector('#all_header'));
    }
  };



  let eventManager = {
    addAllEventListeners: function() {
      this.addDetailsFormMarkCompleteListener();
      this.addDetailsFormSubmitListener();
      this.addMainListListeners();
      this.addModalLayerListener();
      this.addNewTodoListener();
      this.addSideBarListeners();
    },

    addDetailsFormMarkCompleteHandler: function() {
      if (listManager.currently_editing === false) {
        alert('Cannot mark as complete as item has not been created yet!');
        return;
      }
      listManager.toggleComplete(false);
      pageManager.toggleShowFormModal();
    },

    addDetailsFormMarkCompleteListener: function() {
      let markCompleteButton = document.querySelector('button[name="complete"]');
      markCompleteButton.addEventListener('click', eventManager.addDetailsFormMarkCompleteHandler);
    },

    addDetailsFormSubmitListener: function() {
      let detailsForm = document.querySelector('#todo_details_form');
      detailsForm.addEventListener('submit', function() {
        event.preventDefault();
        if (this.elements.form_title.value.length < 3) {
          alert('You must enter a title at least 3 characters long.');
          return;
        }
        pageManager.submitForm.call(this);
      });
    },

    addMainListListeners: function() {
      let editLabels = document.querySelectorAll('td.list_item > label');
      let deleteButtons = document.querySelectorAll('td.delete');
      let toggleListItems = document.querySelectorAll('td.list_item');
      editLabels.forEach(function(editLabel) {
        editLabel.addEventListener('click', this.itemEditHandler);
      }, this);
      deleteButtons.forEach(function(deleteButton) {
        deleteButton.addEventListener('click', this.itemDeleteHandler);
      }, this);
      toggleListItems.forEach(function(toggleListItem) {
        toggleListItem.addEventListener('click', this.listItemToggleHandler);
      }, this);
    },
    
    addModalLayerListener: function() {
      let modalLayer = document.querySelector('#modal_layer');
      modalLayer.addEventListener('click', pageManager.toggleShowFormModal);
    },
    
    addNewTodoListener: function() {
      let addNewTodo = document.querySelector('main > label');
      addNewTodo.addEventListener('click', pageManager.toggleShowFormModal);
    },

    addSideBarListeners: function() {
      let sidebarHeaders = document.querySelectorAll('#sidebar header');
      let sideBarLists = document.querySelectorAll('#sidebar article dl');
      sidebarHeaders.forEach(function(header) {
        header.addEventListener('click', function() {
          let isCompleted = this.dataset.title === "Completed Todos";
          let monthYear = 'all';
          listManager.setCurrentSection(monthYear, isCompleted);
          listManager.updateAllTodoLists();
        });
      });
      sideBarLists.forEach(function(list) {
        list.addEventListener('click', function() {
          let isCompleted = this.parentElement.id === 'completed_lists';
          let monthYear = this.dataset.title;
          listManager.setCurrentSection(monthYear, isCompleted);
          listManager.updateAllTodoLists();
        });
      });
    },

    itemDeleteHandler: function() {
      let id = parseInt(this.closest('tr').dataset.id, 10);
      listManager.deleteTodo(id);
    },

    itemEditHandler: function() {
      event.stopPropagation();
      let id = parseInt(this.closest('tr').dataset.id, 10);
      listManager.setCurrentlyEditing(id);
      pageManager.populateFormModal();
      pageManager.toggleShowFormModal();
    },

    listItemToggleHandler: function() {
      let id = parseInt(this.closest('tr').dataset.id, 10);
      listManager.setCurrentlyEditing(id);
      listManager.toggleComplete(true);
    },
  };

  templateManager.init();
  listManager.init();
});