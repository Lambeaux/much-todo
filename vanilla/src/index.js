import "./index.css";
import "./check.css";

const Dom = {
  byId(id) {
    return document.getElementById(id);
  },
  createDiv() {
    return document.createElement("DIV");
  },
  onBodyClick(handler) {
    document.body.addEventListener("click", handler);
  },
  highlightInput() {
    const el = document.querySelector("input.todo-text");
    if (el === null) {
      return;
    }
    el.focus();
    el.setSelectionRange(0, el.value.length);
  }
};

// TODO - possibly try to separate the draw() calls from this model object
// Look into calls to .bind() for a higher order function
const TodoList = (function() {
  const filters = {
    NONE: item => true,
    COMPLETE: item => item.isDone === true,
    INCOMPLETE: item => item.isDone === false
  };
  const props = {
    filter: "NONE"
  };
  const local = localStorage.getItem("much-todo");
  const state =
    local === null
      ? {
          index: 0,
          itemCount: 0,
          itemCountIncompleteOnly: 0,
          items: []
        }
      : JSON.parse(local);
  return {
    getFilter() {
      return filters[props.filter];
    },
    setFilter(filterName) {
      props.filter = filterName;
      switch (filterName) {
        case "COMPLETE":
          window.location.hash = "#/filter/complete";
          break;
        case "INCOMPLETE":
          window.location.hash = "#/filter/incomplete";
          break;
        default:
          window.location.hash = "#/";
          break;
      }
      // The 'filter' control is not part of the draw() loop
      Dom.byId("filter").value = filterName;
      draw();
    },
    defaultItem() {
      return {
        id: "todo" + state.index++,
        text: undefined,
        isDone: false,
        isEditing: false
      };
    },
    getState() {
      return state;
    },
    add(item) {
      const defaultItem = this.defaultItem();
      state.items.push({
        ...defaultItem,
        ...item
      });
      state.itemCount++;
      state.itemCountIncompleteOnly++;
      draw();
    },
    remove(id) {
      const index = state.items.findIndex(item => item.id === id);
      const item = state.items[index];
      state.itemCount--;
      if (!item.isDone) {
        state.itemCountIncompleteOnly--;
      }
      state.items.splice(index, 1);
      draw();
    },
    toggleComplete(id) {
      const index = state.items.findIndex(item => item.id === id);
      const item = state.items[index];
      if (item.isDone) {
        item.isDone = false;
        state.itemCountIncompleteOnly++;
      } else {
        item.isDone = true;
        state.itemCountIncompleteOnly--;
      }
      draw();
    },
    markAll() {
      state.items.forEach(item => (item.isDone = true));
      state.itemCountIncompleteOnly = 0;
      draw();
    },
    unmarkAll() {
      state.items.forEach(item => (item.isDone = false));
      state.itemCountIncompleteOnly = state.itemCount;
      draw();
    },
    endEdit(id, val) {
      const index = state.items.findIndex(item => item.id === id);
      const item = state.items[index];
      // Revisit if this check is even necessary
      if (item === undefined) {
        return;
      }
      item.text = val;
      state.items.forEach(item => (item.isEditing = false));
      draw();
    },
    startEdit(id) {
      state.items.forEach(item => (item.isEditing = false));
      const index = state.items.findIndex(item => item.id === id);
      const item = state.items[index];
      item.isEditing = true;
      draw();
    }
  };
})();

function onHashChange() {
  const hash = window.location.hash;
  if (hash.startsWith("#/filter/complete")) {
    TodoList.setFilter("COMPLETE");
  } else if (hash.startsWith("#/filter/incomplete")) {
    TodoList.setFilter("INCOMPLETE");
  } else {
    TodoList.setFilter("NONE");
  }
}

function init() {
  window.addEventListener("hashchange", onHashChange, false);
  onHashChange();

  const filterEl = Dom.byId("filter");
  filterEl.addEventListener("change", () => TodoList.setFilter(filterEl.value));

  Dom.byId("markAll").addEventListener("click", () => TodoList.markAll());
  Dom.byId("unmarkAll").addEventListener("click", () => TodoList.unmarkAll());

  Dom.byId("submit").addEventListener("click", () => {
    const inputEl = Dom.byId("field");
    const text = inputEl.value;
    if (text === "") {
      return;
    }
    inputEl.value = "";

    TodoList.add({
      text: text
    });
  });
}

function itemClickHandler(item) {
  return e => {
    const el = e.target;
    if (el.hasAttribute("done")) {
      TodoList.toggleComplete(item.id);
      return;
    }
    if (el.hasAttribute("text") && el.nodeName === "INPUT") {
      e.stopPropagation();
      return;
    }
    if (el.hasAttribute("text") && el.nodeName === "DIV") {
      TodoList.startEdit(item.id);
      e.stopPropagation();
      return;
    }
    if (el.hasAttribute("del")) {
      TodoList.remove(item.id);
      return;
    }
  };
}

function itemToDomNode(item) {
  if (item.isEditing) {
    function clickAwayHandler() {
      const el = Dom.byId(item.id + "txt");
      if (el === null) {
        return;
      }
      TodoList.endEdit(item.id, el.value);
      document.removeEventListener("click", clickAwayHandler);
    }
    Dom.onBodyClick(clickAwayHandler);
  }
  const itemContainer = Dom.createDiv();
  itemContainer.addEventListener("click", itemClickHandler(item));
  itemContainer.innerHTML = `
    <li id="${item.id}">
      <div class="todo-item">
        <button del>X</button>
        <label class="check-container">
          <input done type="checkbox" ${item.isDone ? "checked" : ""}></input>
          <span class="check-mark"></span>
        </label>
        ${
          item.isEditing
            ? `<input text class="todo-text" type="text" id="${item.id +
                "txt"}" value="${item.text}"/>`
            : `<div text class="todo-text">${item.text}</div>`
        }
      </div>
    </li>
  `;
  return itemContainer;
}

function drawDebugJson() {
  const debugEl = Dom.byId("debug");
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.has("debug")) {
    debugEl.textContent = JSON.stringify(TodoList.getState(), null, 2);
  }
}

function drawCounts() {
  Dom.byId("count").innerText = "Item Count: " + TodoList.getState().itemCount;
  Dom.byId("incompleteCount").innerText =
    "Incomplete: " + TodoList.getState().itemCountIncompleteOnly;
}

function drawTodos() {
  const list = Dom.byId("list");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  TodoList.getState()
    .items.filter(TodoList.getFilter())
    .map(item => list.appendChild(itemToDomNode(item)));
}

function draw() {
  localStorage.setItem("much-todo", JSON.stringify(TodoList.getState()));
  drawDebugJson();
  drawCounts();
  drawTodos();

  Dom.highlightInput();
}

init();
draw();
