document.addEventListener("DOMContentLoaded", async () => {
  // Fetch video and asset URLs from the Netlify function
  let response = await fetch('/.netlify/functions/getVideos');
  let data = await response.json();

  const videoUrls = data.videos;
  const finalImageUrl = data.finalImage;
  const backgroundAudioUrl = data.backgroundAudio;
  

  if (videoUrls.length !== 2) {
    console.error("Expected 2 videos, received: ", videoUrls.length);
    return;
  }

  const video1 = document.getElementById("video1");
  const video2 = document.getElementById("video2");
  const finalContainer = document.getElementById("final-container");
  const finalImage = document.getElementById("finalImage");
  const backgroundAudio = document.getElementById("backgroundAudio");

  // Set the asset URLs dynamically
  finalImage.src = finalImageUrl;
  backgroundAudio.src = backgroundAudioUrl;
  backgroundAudio.loop = true;

  // Set video sources
  video1.src = videoUrls[0];
  video2.src = videoUrls[1];

  video1.muted = false;
  video2.muted = false;

  video1.style.opacity = 1;
  video2.style.opacity = 0;

  video1.addEventListener("loadedmetadata", () => {
    video1.play();
  });

  video1.addEventListener("ended", () => {
    video1.style.opacity = 0;
    video2.style.opacity = 1;
    setTimeout(() => {
      video2.play();
    }, 2000);
  });

  video2.addEventListener("ended", () => {
    const videoContainer = document.getElementById("video-container");
    videoContainer.style.transition = "opacity 2s ease";
    videoContainer.style.opacity = 0;
    setTimeout(() => {
      videoContainer.classList.add("hidden");
      finalContainer.classList.remove("hidden");
      backgroundAudio.play().catch(err => console.error("Audio play error:", err));
    }, 2000);
  });
});
