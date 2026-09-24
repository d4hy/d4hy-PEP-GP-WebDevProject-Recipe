/**
 * This script defines the add, view, and delete operations for Ingredient objects in the Recipe Management Application.
 */

const BASE_URL = "http://localhost:8081"; // backend URL

const addIngredientNameInput = document.getElementById("add-ingredient-name-input");
const deleteIngredientNameInput = document.getElementById("delete-ingredient-name-input");
const ingredientListContainer = document.getElementById("ingredient-list");

document.getElementById("add-ingredient-form").addEventListener("submit", event => {
    event.preventDefault();
    addIngredient();
});
document.getElementById("delete-ingredient-form").addEventListener("submit", event => {
    event.preventDefault();
    deleteIngredient();
});

let ingredients = [];

// Load the current ingredient list when the page opens.
getIngredients();

function hasAdminAccess() {
    if (!sessionStorage.getItem("auth-token")) {
        window.location.replace("../login/login-page.html");
        return false;
    }
    if (sessionStorage.getItem("is-admin") !== "true") {
        window.location.replace("../recipe/recipe-page.html");
        return false;
    }
    return true;
}

async function ingredientRequest(path, method = "GET", body) {
    const headers = {
        "Authorization": "Bearer " + sessionStorage.getItem("auth-token")
    };
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403
            ? "Admin access is required. Please check your login."
            : "Ingredient request failed. Please try again.");
    }
    return method === "GET" ? response.json() : null;
}

async function addIngredient() {
    if (!hasAdminAccess()) {
        return;
    }

    const name = addIngredientNameInput.value.trim();
    if (!name) {
        alert("Please enter an ingredient name.");
        return;
    }
    try {
        await ingredientRequest("/ingredients", "POST", { name });
        addIngredientNameInput.value = "";
        await getIngredients();
    } catch (error) {
        console.error("Adding ingredient failed:", error);
        alert(error.message);
    }
}

async function getIngredients() {
    if (!hasAdminAccess()) {
        return false;
    }

    try {
        const data = await ingredientRequest("/ingredients");
        if (!Array.isArray(data)) {
            throw new Error("Unable to read the ingredient list.");
        }

        ingredients = data;
        refreshIngredientList();
        return true;
    } catch (error) {
        console.error("Loading ingredients failed:", error);
        alert(error.message);
        return false;
    }
}

async function deleteIngredient() {
    if (!hasAdminAccess()) {
        return;
    }

    const name = deleteIngredientNameInput.value.trim();
    if (!name) {
        alert("Please enter an ingredient name.");
        return;
    }
    if (!await getIngredients()) {
        return;
    }

    // Use the backend ID, which may differ from the list position after deletion.
    const matches = ingredients.filter(ingredient => ingredient.name.toLowerCase() === name.toLowerCase());
    if (matches.length !== 1) {
        if (matches.length) {
            alert("More than one ingredient has that name. Please use a unique ingredient name.");
        } else {
            alert("Ingredient not found.");
        }
        return;
    }
    try {
        await ingredientRequest(`/ingredients/${matches[0].id}`, "DELETE");
        deleteIngredientNameInput.value = "";
        await getIngredients();
    } catch (error) {
        console.error("Deleting ingredient failed:", error);
        alert(error.message);
    }
}

function refreshIngredientList() {
    ingredientListContainer.replaceChildren();
    ingredients.forEach(ingredient => {
        const item = document.createElement("li");
        const name = document.createElement("p");
        item.dataset.id = ingredient.id;
        name.textContent = ingredient.name;
        item.appendChild(name);
        ingredientListContainer.appendChild(item);
    });
}
