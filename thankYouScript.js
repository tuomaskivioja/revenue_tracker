// Function to get a cookie by name
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to set a cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

// Function to send user info to the server after purchase
function sendPurchaseInfoToServer(userInfo) {
    const username = userInfo.username;  // Extract the username from the userInfo

    // Ensure the username is present
    if (!username) {
        console.error('Username not found in userInfo.');
        return;
    }

    // Make the POST request to the server with the username in the URL
    fetch(`http://localhost:5001/api/purchase/${username}`, {  // Dynamically add the username to the URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),  // Send the user info in the request body
    })
    .then(response => response.json())
    .then(data => {
        console.log('Purchase info sent successfully:', data);
        // Update the userInfo cookie to mark that the purchase has been made
        userInfo.hasPurchased = true;  // Add or update the purchase flag in the userInfo
        setCookie('userInfo', JSON.stringify(userInfo), 30);  // Update the cookie for 30 days
    })
    .catch((error) => {
        console.error('Error sending purchase info:', error);
    });
}

// Log cookie information when the page loads and send it to the server if not already sent
window.addEventListener('DOMContentLoaded', (event) => {
    // Get the 'userInfo' cookie
    const userInfoCookie = getCookie('userInfo');
    if (userInfoCookie) {
        // Parse the userInfo cookie
        const userInfo = JSON.parse(userInfoCookie);

        // Check if the user has already made a purchase
        if (userInfo.hasPurchased) {
            console.log('User has already made a purchase, skipping request.');
            return;
        }

        // Log the userInfo
        console.log('Purchase made by user:', userInfo);

        // Send the user info to the server
        sendPurchaseInfoToServer(userInfo);
    } else {
        console.log('No user info cookie found.');
    }
});
