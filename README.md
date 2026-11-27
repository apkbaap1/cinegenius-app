# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cel Stand

The **Cel Stand** tab (`/#cel-stand`) is a layered cel-animation editor: split one painting into
sky / clouds / scenery, add character pose and mouth cels, lip-sync to voice-over, recolour costumes,
and export an MP4, all in the browser with no generative video. See
[components/celstand/README.md](components/celstand/README.md).
