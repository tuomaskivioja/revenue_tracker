// Function to generate a unique tag for the user
function generateUserTag() {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Function to get a cookie by name
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
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
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; // Ensure SameSite policy allows cross-page cookies
    console.log('Cookie set:', document.cookie);  // Log the current cookies to debug
}

// Hardcoded customer username (for your client who installs the script on their website)
const customerUsername = 'InternetMadeCoder';  // This is where the customer's username is hardcoded

// Function to save the tag, IP, and hardcoded customer username as a cookie
function saveUserTagAndCustomerUsername() {
    const tag = generateUserTag();
    const userInfo = {
        tag: tag,
        username: customerUsername // Use the hardcoded customer username
    };
    // Store the user info object as a cookie
    setCookie('userInfo', JSON.stringify(userInfo), 30); // Store for 30 days
    console.log('User Info Saved:', userInfo);
}


// Function to send a video click event to the server
function sendVideoClickToServer(videoId) {
    const userInfoCookie = getCookie('userInfo');
    if (!userInfoCookie) {
        console.error('No user info found, skipping click tracking.');
        return;
    }

    const userInfo = JSON.parse(userInfoCookie);

    // Create the payload to send to the server
    const payload = {
        username: userInfo.username,
        videoClicked: videoId,
        tag: userInfo.tag,
        ip: userInfo.ip
    };

    // Send the POST request to the server to track the click
    fetch(`http://localhost:5001/api/video-click/${userInfo.username}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),  // Send the payload with the video click and user info
    })
    .then(response => response.json())
    .then(data => {
        console.log('Video click info sent successfully:', data);
        // Mark the video click as sent for this session
        sessionStorage.setItem(`videoClick_${videoId}`, 'true');
    })
    .catch(error => {
        console.error('Error sending video click info:', error);
    });
}

// Function to get the "video" parameter from the URL
function getVideoParameter() {
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('video') || 'N/A';  // Default to 'N/A' if no video parameter is present
    return videoParam;
}

// Check if the video click has already been sent
function isVideoClickAlreadyTracked(videoId) {
    return sessionStorage.getItem(`videoClick_${videoId}`) === 'true';
}

// Update the userInfo cookie with the video parameter and track the video click
window.addEventListener('DOMContentLoaded', () => {
    const videoParam = getVideoParameter();

    // Check if the click has already been tracked for this video
    if (isVideoClickAlreadyTracked(videoParam)) {
        console.log(`Video click already tracked for video: ${videoParam}`);
        return;
    }

    // Get the existing userInfo cookie
    let userInfoCookie = getCookie('userInfo');

    if (userInfoCookie) {
        // Parse the userInfo cookie if it exists
        let userInfo = JSON.parse(userInfoCookie);

        // Add the video parameter as videoClicked
        userInfo.videoClicked = videoParam;

        // Store the updated userInfo cookie
        setCookie('userInfo', JSON.stringify(userInfo), 30);  // Update for 30 days
        console.log('Updated userInfo:', userInfo);

        // Send the video click event to the server
        // sendVideoClickToServer(videoParam);
    } else {
        // If no userInfo cookie exists, create a new one with videoClicked
        const userInfo = {
            videoClicked: videoParam,
            username: customerUsername  // Add the customer username to the initial cookie creation
        };
        setCookie('userInfo', JSON.stringify(userInfo), 30);  // Create for 30 days
        console.log('Created userInfo:', userInfo);

        // Send the video click event to the server
        // sendVideoClickToServer(videoParam);
    }
});
