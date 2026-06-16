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
