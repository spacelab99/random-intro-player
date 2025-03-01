require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client using environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Fetch unplayed videos
  let { data: unplayedVideos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('played', false);

  if (error) {
    console.error("Error fetching videos:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch videos" }) };
  }

// If there are fewer than 2 unplayed videos, reset all to unplayed
if (unplayedVideos.length < 2) {
    const { error: resetError } = await supabase
      .from('videos')
      .update({ played: false })
      .gt('id', 0); // This ensures a WHERE clause is added to the query
    if (resetError) {
      console.error("Error resetting videos:", resetError);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to reset videos" }) };
    }
    let { data: refreshedVideos, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('played', false);
    if (fetchError) {
      console.error("Error re-fetching videos:", fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch videos after reset" }) };
    }
    unplayedVideos = refreshedVideos;
  }
  

  // Randomly select 2 videos
  const selectedVideos = [];
  while (selectedVideos.length < 2 && unplayedVideos.length > 0) {
    const index = Math.floor(Math.random() * unplayedVideos.length);
    selectedVideos.push(unplayedVideos[index]);
    unplayedVideos.splice(index, 1);
  }

  // Mark selected videos as played
  for (let video of selectedVideos) {
    const { error: updateError } = await supabase
      .from('videos')
      .update({ played: true })
      .eq('id', video.id);
    if (updateError) {
      console.error("Error updating video:", updateError);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to update video status" }) };
    }
  }

  // Fetch assets (final image and background audio)
  const { data: assetsData, error: assetsError } = await supabase
    .from('assets')
    .select('*')
    .in('name', ['final_image', 'background_audio']);

  if (assetsError) {
    console.error("Error fetching assets:", assetsError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch assets" }) };
  }

  // Extract URLs for final image and background audio
  const finalImageAsset = assetsData.find(asset => asset.name === 'final_image');
  const backgroundAudioAsset = assetsData.find(asset => asset.name === 'background_audio');

  return {
    statusCode: 200,
    body: JSON.stringify({
      videos: selectedVideos.map(video => video.url),
      finalImage: finalImageAsset ? finalImageAsset.url : null,
      backgroundAudio: backgroundAudioAsset ? backgroundAudioAsset.url : null
    })
  };
};
