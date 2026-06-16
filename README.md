# Rising Stars Flyer Generator

An interactive, high-performance client-side web application for customizing and downloading high-resolution (3000x3000px) event flyers.

## How to Run

Follow these instructions to run the application locally or deploy it.

### 1. Install Dependencies
Before running the app for the first time, install the required packages:
```bash
npm install
```

### 2. Start the Local Development Server
To launch the interactive editor locally with real-time hot reloading (HMR):
```bash
npm run dev
```
After starting, open your browser and navigate to:
[http://localhost:5173](http://localhost:5173)

### 3. Build for Production
To compile and bundle the React code into optimized, static production files (saved in the `dist/` folder):
```bash
npm run build
```

### 4. Deploy to GitHub Pages
The project is configured with relative pathing (`./`) and includes automated deployment commands. To build and publish your customized flyer generator directly to your GitHub repository's `gh-pages` branch:
```bash
npm run deploy
```

## Features

* **Direct Drag-and-Pan Controls**: Click and drag your profile picture directly inside the circular canvas preview to frame it perfectly.
* **Scale Slider**: Zoom your photo in or out dynamically (from 50% to 300%).
* **Custom Typography**: Features Google's variable font `Outfit` rendered directly on canvas.
* **Layout Masking**: Automatically processes the template overlay on load, masking out the photo frame so your profile photo sits correctly behind the green waves and details banner.
* **High-Res Download**: Exports the flyer at print-ready 3000x3000px resolution.

## Customizing Layouts (For Future Templates)

The flyer layout is entirely configuration-driven. When you need to update the generator for next year's template, you only need to swap the design file and update the configuration parameters.

### 1. Swap the Template Design
Replace the template image at `public/temp.png` with your new design template.

### 2. Update Layout configuration (`src/flyerConfig.json`)
Open `src/flyerConfig.json` and adjust the layout values to match your new template coordinates:

```json
{
  "template": {
    "src": "./temp.png",
    "size": 3000
  },
  "pfp": {
    "center": {
      "x": 824,
      "y": 1524
    },
    "radius": 415
  },
  "text": {
    "fontName": "OutfitFont",
    "align": "left",
    "baseline": "top",
    "color": "#ffffff",
    "left": 600,
    "fields": [
      {
        "id": "name",
        "style": "bold",
        "size": 105,
        "y": 1940
      },
      {
        "id": "position",
        "style": "",
        "size": 65,
        "y": 2065
      },
      {
        "id": "optional",
        "style": "",
        "size": 52,
        "y": 2155
      }
    ]
  }
}
```

### Configuration Parameters:
* **`template`**:
  * `src`: Path to the template PNG asset in the `public` directory.
  * `size`: The resolution width/height of the template image in pixels (e.g., `3000` for a `3000x3000px` canvas).
* **`pfp`**:
  * `center`: The exact `{ x, y }` pixel coordinates of the center of your template's profile picture frame.
  * `radius`: The clipping radius in pixels (e.g., `415`). The image will be cropped to this circle and a white border outline will automatically be drawn around it.
* **`text`**:
  * `fontName`: The name of the loaded custom font family.
  * `align`: Horizontal text alignment (`"left"`, `"center"`, or `"right"`).
  * `color`: Color fill code of the text (e.g., `"#ffffff"`).
  * `left`: The X coordinate where the text starts.
  * `fields`: An array representing each text input field to draw:
    * `id`: The key identifier matching the React state (`"name"`, `"position"`, or `"optional"`).
    * `style`: The font style (e.g., `"bold"` or `""` for regular).
    * `size`: Font size in pixels.
    * `y`: The Y coordinate where this specific line of text is drawn.
