import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Configuration for animations
const config = {
    gap: 0.08, // Gap between floating image animations
    speed: 0.3, // Speed of each image animation
    arcRadius: 500 // Radius of the bezier curve
};

// Data for dynamic content
const spotlightItems = [
    { name: "First Item", image: "image1.png" },
    { name: "Second Item", image: "image2.png" },
    { name: "Third Item", image: "image3.png" },
    { name: "Fourth Item", image: "image4.png" }
];

// Initialize smooth scrolling with Lenis
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// DOM element queries
const titlesContainer = document.querySelector('.spotlight-titles');
const imagesContainer = document.querySelector('.spotlight-images');
const sideHeader = document.querySelector('.spotlight-header');
const titlesClipper = document.querySelector('.spotlight-titles-container');
const introTextElements = document.querySelectorAll('.spotlight-intro-text');
const imageElements = [];

// Dynamic content generation
spotlightItems.forEach((item, index) => {
    const titleElement = document.createElement('h1');
    titleElement.textContent = item.name;
    if (index === 0) titleElement.style.opacity = "1";
    titlesContainer.appendChild(titleElement);

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'spotlight-image';
    const imgElement = document.createElement('img');
    imgElement.src = item.image;
    imgElement.alt = "";
    imgWrapper.appendChild(imgElement);
    imagesContainer.appendChild(imgWrapper);
    imageElements.push(imgWrapper);
});

const titleElements = titlesContainer.querySelectorAll('h1');
let currentActiveIndex = 0;

// Bezier Curve Logic
const containerWidth = window.innerWidth * 0.3;
const containerHeight = window.innerHeight;
const arcStartX = containerWidth - 220;
const arcStartY = -200;
const arcEndY = containerHeight + 200;
const arcControlPointX = arcStartX + config.arcRadius;
const arcControlPointY = containerHeight / 2;


function getBezierPosition(t) {
    const x =
        (1 - t) * (1 - t) * arcStartX +
        2 * (1 - t) * t * arcControlPointX +
        t * t * arcStartX;
    const y =
        (1 - t) * (1 - t) * arcStartY +
        2 * (1 - t) * t * arcControlPointY +
        t * t * arcEndY;
    return { x, y };
}

// Function to calculate individual image progress
function getImageProgressState(index, totalProgress) {
    const start = index * config.gap;
    const end = start + config.speed;

    if (totalProgress < start) return -1; // Not yet started
    if (totalProgress > end) return 2; // Finished
    return (totalProgress - start) / config.speed; // Normalized progress
}

// Initial state for images
imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));

// Main ScrollTrigger setup
ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: `+=${window.innerHeight * 10}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
        const progress = self.progress;

        // Intro animation segment (0% to 20%)
        if (progress <= 0.2) {
            const animationProgress = progress / 0.2;
            const moveDistance = window.innerWidth * 0.6;

            gsap.set(introTextElements[0], {
                x: -animationProgress * moveDistance,
            });
            gsap.set(introTextElements[1], {
                x: animationProgress * moveDistance,
            });
            gsap.set(introTextElements[0], { opacity: 1 });
            gsap.set(introTextElements[1], { opacity: 1 });

            gsap.set(".spotlight-bg-image", {
                scale: animationProgress,
            });
            gsap.set(".spotlight-bg-image img", {
                scale: 1.5 - animationProgress * 0.5,
            });

            imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));
            sideHeader.style.opacity = "0";
            gsap.set(titlesClipper, {
                "--before-opacity": "0",
                "--after-opacity": "0",
            });

        } else if (progress > 0.2 && progress <= 0.25) {
            gsap.set(".spotlight-bg-image", { scale: 1 });
            gsap.set(".spotlight-bg-image img", { scale: 1 });

            gsap.set(introTextElements[0], { opacity: 0 });
            gsap.set(introTextElements[1], { opacity: 0 });

            imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));
            sideHeader.style.opacity = "1";
            gsap.set(titlesClipper, {
                "--before-opacity": "1",
                "--after-opacity": "1",
            });
        } else if (progress > 0.25 && progress <= 0.95) {
            gsap.set(".spotlight-bg-image", { scale: 1 });
            gsap.set(".spotlight-bg-image img", { scale: 1 });

            gsap.set(introTextElements[0], { opacity: 0 });
            gsap.set(introTextElements[1], { opacity: 0 });

            sideHeader.style.opacity = "1";
            gsap.set(titlesClipper, {
                "--before-opacity": "1",
                "--after-opacity": "1",
            });
        }


        const switchProgress = (progress - 0.25) / 0.7;
        const viewportHeight = window.innerHeight;
        const titlesContainerHeight = titlesContainer.scrollHeight;
        const startPosition = viewportHeight;
        const targetPosition = -titlesContainerHeight;
        const totalDistance = startPosition - targetPosition;
        const currentY = startPosition - switchProgress * totalDistance;

        gsap.set(".spotlight-titles", {
            y: currentY
        });

        imageElements.forEach((img, index) => {
            const imageProgress = getImageProgressState(index, switchProgress);

            if (imageProgress < 0 || imageProgress > 1) {
                gsap.set(img, { opacity: 0 });
            } else {
                // Calculate the position using a Bezier curve
                const pos = getBezierPosition(imageProgress);

                // Set the image's position and make it visible
                gsap.set(img, {
                    x: pos.x - 100,
                    y: pos.y - 75,
                    opacity: 1,
                });
            }
        });

        const viewportMiddle = viewportHeight / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        titleElements.forEach((title, index) => {
            const titleRect = title.getBoundingClientRect();
            const titleCenter = titleRect.top + titleRect.height / 2;
            const distanceFromCenter = Math.abs(titleCenter - viewportMiddle);

            if (distanceFromCenter < closestDistance) {
                closestDistance = distanceFromCenter;
                closestIndex = index;
            }
        });

        if (closestIndex !== currentActiveIndex) {
            if (titleElements[currentActiveIndex]) {
                titleElements[currentActiveIndex].style.opacity = "0.25";
            }
            titleElements[closestIndex].style.opacity = "1";
            document.querySelector(".spotlight-bg-image img").src = spotlightItems[closestIndex].image;
            currentActiveIndex = closestIndex;
        } else if (progress > 0.95) {
            sideHeader.style.opacity = "0";
            gsap.set(titlesClipper, {
                "--before-opacity": "0",
                "--after-opacity": "0",
            });
        }
    }
});
