import "./index.css";

// TODO - possibly try to separate the draw() calls from this model object
// Look into calls to .bind() for a higher order function
const TodoList = (function() {
  var index = 0;
  const filters = {
    NONE: item => true,
    COMPLETE: item => item.isDone === true,
    INCOMPLETE: item => item.isDone === false
  };
  const state = {
    itemCount: 0,
    itemCountIncompleteOnly: 0,
    filter: "NONE",
    items: []
  };
  return {
    getFilter() {
      return filters[state.filter];
    },
    setFilter(filterName) {
      state.filter = filterName;
      draw();
    },
    defaultItem() {
      return {
        id: "todo" + ++index,
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
    completeAll() {
      state.items.forEach(item => (item.isDone = true));
      state.itemCountIncompleteOnly = 0;
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

function draw() {
  const itemToDomNode = function(item) {
    const listEl = document.createElement("LI");
    listEl.setAttribute("id", item.id);

    const checkEl = document.createElement("INPUT");
    checkEl.setAttribute("type", "checkbox");
    checkEl.addEventListener("click", () => TodoList.toggleComplete(item.id));
    if (item.isDone) {
      checkEl.checked = true;
    }

    var textEl;
    if (item.isEditing) {
      textEl = document.createElement("INPUT");
      textEl.value = item.text;
      textEl.addEventListener("click", e => e.stopPropagation());
      document.body.addEventListener("click", () =>
        TodoList.endEdit(item.id, textEl.value)
      );
    } else {
      textEl = document.createElement("DIV");
      textEl.textContent = item.text;
      textEl.addEventListener("click", e => {
        TodoList.startEdit(item.id);
        e.stopPropagation();
      });
    }

    const delBtnEl = document.createElement("BUTTON");
    delBtnEl.innerText = "X";
    delBtnEl.addEventListener("click", () => TodoList.remove(item.id));

    const wrapperDivEl = document.createElement("DIV");
    wrapperDivEl.appendChild(checkEl);
    wrapperDivEl.appendChild(textEl);
    wrapperDivEl.appendChild(delBtnEl);

    wrapperDivEl.setAttribute("class", "todo-item");

    listEl.appendChild(wrapperDivEl);

    return listEl;
  };

  const debugEl = document.getElementById("debug");
  debugEl.textContent = JSON.stringify(TodoList.getState(), null, 2);

  document.getElementById("count").innerText =
    "Item Count: " + TodoList.getState().itemCount;
  document.getElementById("incompleteCount").innerText =
    "Incomplete Item Count: " + TodoList.getState().itemCountIncompleteOnly;

  const list = document.getElementById("list");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  TodoList.getState()
    .items.filter(TodoList.getFilter())
    .map(item => list.appendChild(itemToDomNode(item)));
}

const filterEl = document.getElementById("filter");
filterEl.addEventListener("change", () => TodoList.setFilter(filterEl.value));

document
  .getElementById("completeAll")
  .addEventListener("click", () => TodoList.completeAll());
document.getElementById("submit").addEventListener("click", () => {
  const inputEl = document.getElementById("field");
  const text = inputEl.value;
  if (text === "") {
    return;
  }
  inputEl.value = "";

  TodoList.add({
    text: text
  });
});

draw();
