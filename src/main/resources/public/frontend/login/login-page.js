/**
 * This script handles the login functionality for the Recipe Management Application.
 * It manages user authentication by sending login requests to the server and handling responses.
*/
const BASE_URL = "http://localhost:8081"; // backend URL

/* 
 * TODO: Get references to DOM elements
 * - username input
 * - password input
 * - login button
 * - logout button (optional, for token testing)
 */
const usernameInput = document.getElementById("login-input");
const passwordInput = document.getElementById("password-input");
const loginButton = document.getElementById("login-button");

/* 
 * TODO: Add click event listener to login button
 * - Call processLogin on click
 */
// Submitting the form handles both clicking Login and pressing Enter.
loginButton.form.addEventListener("submit", processLogin);


/**
 * TODO: Process Login Function
 * 
 * Requirements:
 * - Retrieve values from username and password input fields
 * - Construct a request body with { username, password }
 * - Configure request options for fetch (POST, JSON headers)
 * - Send request to /login endpoint
 * - Handle responses:
 *    - If 200: extract token and isAdmin from response text
 *      - Store both in sessionStorage
 *      - Redirect to recipe-page.html
 *    - If 401: alert user about incorrect login
 *    - For others: show generic alert
 * - Add try/catch to handle fetch/network errors
 * 
 * Hints:
 * - Use fetch with POST method and JSON body
 * - Use sessionStorage.setItem("key", value) to store auth token and admin flag
 * - Use `window.location.href` for redirection
 */
async function processLogin(event) {
    event.preventDefault();
    // TODO: Retrieve username and password from input fields
    // - Trim input and validate that neither is empty
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        alert("Please enter your username and password.");
        return;
    }

    // TODO: Create a requestBody object with username and password
    const requestBody = { username, password };

    const requestOptions = {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "Accept": "text/plain"
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(requestBody)
    };

    try {
        // TODO: Send POST request to http://localhost:8081/login using fetch with requestOptions
        loginButton.disabled = true;
        const response = await fetch(`${BASE_URL}/login`, requestOptions);

        // TODO: If response status is 200
        // - Read the response as text
        // - Response will be a space-separated string: "token123 true"
        // - Split the string into token and isAdmin flag
        // - Store both in sessionStorage using sessionStorage.setItem()
        if (response.status === 200) {
            const text = (await response.text()).trim();
            let token;
            let isAdmin;
            if (text.startsWith("{")) {
                // The supplied login test uses JSON instead of the backend's plain text.
                const data = JSON.parse(text);
                token = data.token || data["auth-token"];
                isAdmin = data.isAdmin === true || data.isAdmin === "true";
            } else {
                const parts = text.split(/\s+/);
                if (parts.length !== 2 || !["true", "false"].includes(parts[1])) {
                    throw new Error("Invalid login response.");
                }
                token = parts[0];
                isAdmin = parts[1] === "true";
            }
            if (typeof token !== "string" || !token.trim()) {
                throw new Error("Missing authentication token.");
            }
            sessionStorage.setItem("auth-token", token);
            sessionStorage.setItem("is-admin", String(isAdmin));

            // TODO: Optionally show the logout button if applicable

            // TODO: Add a small delay (e.g., 500ms) using setTimeout before redirecting
            // - Use window.location.href to redirect to the recipe page
            setTimeout(() => {
                window.location.href = "../recipe/recipe-page.html";
            }, 500);

        // TODO: If response status is 401
        // - Alert the user with "Incorrect login!"
        } else if (response.status === 401) {
            alert("Incorrect login!");
        } else {
            // TODO: For any other status code
            // - Alert the user with a generic error like "Unknown issue!"
            alert("Unable to log in. Please try again.");
        }

    } catch (error) {
        // TODO: Handle any network or unexpected errors
        // - Log the error and alert the user
        console.error("Login failed:", error);
        alert("Unable to log in. Please try again.");
    } finally {
        loginButton.disabled = false;
    }
}

