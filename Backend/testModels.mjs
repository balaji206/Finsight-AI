async function run() {
  try {
     const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBaGamto9kAVBFfLh_yUrbTGAafncHUQPs");
     const data = await res.json();
     console.log(JSON.stringify(data, null, 2));
  } catch (err) {
     console.error(err);
  }
}
run();
