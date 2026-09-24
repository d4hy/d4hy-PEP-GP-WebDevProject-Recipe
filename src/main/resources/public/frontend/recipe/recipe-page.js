/**
 * This script defines the CRUD operations for Recipe objects in the Recipe Management Application.
 */

const BASE_URL = "http://localhost:8081"; // backend URL

let recipes = [];

// Wait for DOM to fully load before accessing elements
window.addEventListener("DOMContentLoaded", () => {
    const addNameInput = document.getElementById("add-recipe-name-input");
    const addInstructionsInput = document.getElementById("add-recipe-instructions-input");
    const updateNameInput = document.getElementById("update-recipe-name-input");
    const updateInstructionsInput = document.getElementById("update-recipe-instructions-input");
    const deleteNameInput = document.getElementById("delete-recipe-name-input");
    const recipeList = document.getElementById("recipe-list");
    const adminLink = document.getElementById("admin-link");
    const logoutButton = document.getElementById("logout-button");
    const searchInput = document.getElementById("search-input");

    // Show logout only while the browser tab has an authentication token.
    logoutButton.hidden = !sessionStorage.getItem("auth-token");

    // Show the ingredient link only to an authenticated administrator.
    function displayAdminLink() {
        adminLink.hidden = !(sessionStorage.getItem("auth-token") &&
            sessionStorage.getItem("is-admin") === "true");
    }
    displayAdminLink();

    document.getElementById("add-recipe-form").addEventListener("submit", event => {
        event.preventDefault();
        addRecipe();
    });
    document.getElementById("update-recipe-form").addEventListener("submit", event => {
        event.preventDefault();
        updateRecipe();
    });
    document.getElementById("delete-recipe-form").addEventListener("submit", event => {
        event.preventDefault();
        deleteRecipe();
    });
    document.getElementById("search-form").addEventListener("submit", event => {
        event.preventDefault();
        searchRecipes();
    });
    logoutButton.addEventListener("click", processLogout);

    // Populate the recipe list when the page loads.
    getRecipes();

    function requireLogin() {
        if (sessionStorage.getItem("auth-token")) {
            return true;
        }
        alert("Please log in first.");
        return false;
    }

    async function recipeRequest(path, method = "GET", body) {
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

        // The supplied backend returns 404 when the recipe collection is empty.
        if (method === "GET" && path === "/recipes" && response.status === 404) {
            return [];
        }
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("You are not authorized to perform this action. Please check your login.");
            }
            throw new Error("Recipe request failed. Please try again.");
        }
        return method === "GET" ? response.json() : null;
    }

    function findRecipe(name) {
        const matches = recipes.filter(recipe => recipe.name.toLowerCase() === name.toLowerCase());
        if (matches.length !== 1) {
            if (matches.length) {
                alert("More than one recipe has that name. Please use a unique recipe name.");
            } else {
                alert("Recipe not found.");
            }
            return null;
        }
        return matches[0];
    }

    /**
     * Search uses the current input value when refreshRecipeList filters the loaded recipes.
     */
    async function searchRecipes() {
        refreshRecipeList();
    }

    async function addRecipe() {
        if (!requireLogin()) {
            return;
        }
        const name = addNameInput.value.trim();
        const instructions = addInstructionsInput.value.trim();
        if (!name || !instructions) {
            alert("Please enter a recipe name and instructions.");
            return;
        }
        try {
            await recipeRequest("/recipes", "POST", { name, instructions });
            addNameInput.value = "";
            addInstructionsInput.value = "";
            await getRecipes();
        } catch (error) {
            console.error("Adding recipe failed:", error);
            alert(error.message);
        }
    }

    async function updateRecipe() {
        if (!requireLogin()) {
            return;
        }
        const name = updateNameInput.value.trim();
        const instructions = updateInstructionsInput.value.trim();
        if (!name || !instructions) {
            alert("Please enter a recipe name and new instructions.");
            return;
        }
        if (!await getRecipes()) {
            return;
        }
        const recipe = findRecipe(name);
        if (!recipe) {
            return;
        }
        try {
            await recipeRequest(`/recipes/${recipe.id}`, "PUT", { instructions });
            updateNameInput.value = "";
            updateInstructionsInput.value = "";
            await getRecipes();
        } catch (error) {
            console.error("Updating recipe failed:", error);
            alert(error.message);
        }
    }

    async function deleteRecipe() {
        if (!requireLogin()) {
            return;
        }
        const name = deleteNameInput.value.trim();
        if (!name) {
            alert("Please enter a recipe name.");
            return;
        }
        if (!await getRecipes()) {
            return;
        }
        const recipe = findRecipe(name);
        if (!recipe) {
            return;
        }
        try {
            await recipeRequest(`/recipes/${recipe.id}`, "DELETE");
            deleteNameInput.value = "";
            await getRecipes();
        } catch (error) {
            console.error("Deleting recipe failed:", error);
            alert(error.message);
        }
    }

    async function getRecipes() {
        try {
            const data = await recipeRequest("/recipes");
            if (!Array.isArray(data)) {
                throw new Error("Unable to read the recipe list.");
            }
            recipes = data;
            refreshRecipeList();
            return true;
        } catch (error) {
            console.error("Loading recipes failed:", error);
            alert(error.message);
            return false;
        }
    }

    function refreshRecipeList() {
        const term = searchInput.value.trim().toLowerCase();
        recipeList.replaceChildren();

        // Every recipe name includes an empty string, so a blank search displays all recipes.
        recipes.filter(recipe => recipe.name.toLowerCase().includes(term)).forEach(recipe => {
            const item = document.createElement("li");
            const name = document.createElement("strong");
            const instructions = document.createElement("div");
            instructions.className = "recipe-instructions";
            item.dataset.id = recipe.id;
            name.textContent = recipe.name;
            instructions.textContent = recipe.instructions;
            item.append(name, instructions);
            recipeList.appendChild(item);
        });
    }

    async function processLogout() {
        try {
            await recipeRequest("/logout", "POST");
            sessionStorage.removeItem("auth-token");
            sessionStorage.removeItem("is-admin");
            window.location.href = "../login/login-page.html";
        } catch (error) {
            console.error("Logout failed:", error);
            alert("Unable to log out. Please try again.");
        }
    }
});
