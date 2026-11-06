#!/usr/bin/env python3
"""Composite a background image into a light mosque silhouette on a poster."""

import argparse
from pathlib import Path

import cv2
import numpy as np


NORMALIZED_BOUNDS = {
    "xmin": 205,
    "ymin": 190,
    "xmax": 805,
    "ymax": 680,
}
BOTTOM_EXCLUSION = 675


def resize_cover(image: np.ndarray, width: int, height: int) -> np.ndarray:
    """Resize to cover the target dimensions, then center-crop."""
    source_height, source_width = image.shape[:2]
    scale = max(width / source_width, height / source_height)
    resized = cv2.resize(
        image,
        (int(round(source_width * scale)), int(round(source_height * scale))),
        interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC,
    )
    top = (resized.shape[0] - height) // 2
    left = (resized.shape[1] - width) // 2
    return resized[top : top + height, left : left + width]


def make_mosque_mask(
    poster: np.ndarray,
    bounds: tuple[int, int, int, int],
    min_lightness: int,
    max_saturation: int,
    min_value: int,
) -> np.ndarray:
    """Threshold the bounded poster region and retain its largest silhouette."""
    x0, y0, x1, y1 = bounds
    mask_bottom = min(y1, round(BOTTOM_EXCLUSION * poster.shape[0] / 1000))
    if mask_bottom <= y0:
        raise ValueError("The poster is too short for the configured mosque bounds.")

    roi = poster[y0:mask_bottom, x0:x1]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB)
    light_neutral = (
        (lab[:, :, 0] >= min_lightness)
        & (hsv[:, :, 1] <= max_saturation)
        & (hsv[:, :, 2] >= min_value)
    ).astype(np.uint8) * 255

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    closed = cv2.morphologyEx(light_neutral, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(
        closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        raise ValueError(
            "No light mosque silhouette found. Try lowering --min-lightness or "
            "raising --max-saturation."
        )

    silhouette = np.zeros(roi.shape[:2], dtype=np.uint8)
    largest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest) < roi.shape[0] * roi.shape[1] * 0.01:
        raise ValueError(
            "The detected silhouette is unexpectedly small. Adjust the "
            "segmentation thresholds for this poster."
        )
    cv2.drawContours(silhouette, [largest], -1, 255, thickness=cv2.FILLED)

    softened = cv2.GaussianBlur(silhouette, (5, 5), sigmaX=0)
    full_mask = np.zeros(poster.shape[:2], dtype=np.uint8)
    full_mask[y0:mask_bottom, x0:x1] = softened
    return full_mask


def composite(
    poster: np.ndarray,
    background: np.ndarray,
    bounds: tuple[int, int, int, int],
    min_lightness: int,
    max_saturation: int,
    min_value: int,
) -> np.ndarray:
    x0, y0, x1, y1 = bounds
    width, height = x1 - x0, y1 - y0
    replacement = resize_cover(background, width, height).astype(np.float32) / 255.0
    original_roi = poster[y0:y1, x0:x1].astype(np.float32) / 255.0

    # Use the poster's luminance as a subtle overlay to retain facade shading.
    luminance = cv2.cvtColor(poster, cv2.COLOR_BGR2GRAY)[y0:y1, x0:x1]
    shading = luminance.astype(np.float32)[:, :, None] / 255.0
    overlay = np.where(
        replacement <= 0.5,
        2.0 * replacement * shading,
        1.0 - 2.0 * (1.0 - replacement) * (1.0 - shading),
    )
    blended = np.clip(0.75 * replacement + 0.25 * overlay, 0.0, 1.0)

    full_mask = make_mosque_mask(
        poster, bounds, min_lightness, max_saturation, min_value
    )
    alpha = full_mask[y0:y1, x0:x1].astype(np.float32)[:, :, None] / 255.0
    output = poster.astype(np.float32) / 255.0
    output[y0:y1, x0:x1] = original_roi * (1.0 - alpha) + blended * alpha
    return np.clip(output * 255.0, 0, 255).astype(np.uint8)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    script_dir = Path(__file__).resolve().parent
    parser.add_argument(
        "--poster",
        type=Path,
        default=script_dir / "image_c921c1.jpg",
        help="poster image to preserve (default: image_c921c1.jpg)",
    )
    parser.add_argument(
        "--background",
        type=Path,
        default=script_dir / "maxresdefault.jpg",
        help="image to composite into the mosque (default: maxresdefault.jpg)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=script_dir / "output_mosque_poster.jpg",
        help="output JPEG path",
    )
    parser.add_argument("--min-lightness", type=int, default=145)
    parser.add_argument("--max-saturation", type=int, default=110)
    parser.add_argument("--min-value", type=int, default=125)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    poster = cv2.imread(str(args.poster), cv2.IMREAD_COLOR)
    background = cv2.imread(str(args.background), cv2.IMREAD_COLOR)
    if poster is None:
        raise FileNotFoundError(f"Could not read poster image: {args.poster}")
    if background is None:
        raise FileNotFoundError(f"Could not read background image: {args.background}")

    height, width = poster.shape[:2]
    bounds = (
        round(NORMALIZED_BOUNDS["xmin"] * width / 1000),
        round(NORMALIZED_BOUNDS["ymin"] * height / 1000),
        round(NORMALIZED_BOUNDS["xmax"] * width / 1000),
        round(NORMALIZED_BOUNDS["ymax"] * height / 1000),
    )
    if bounds[2] > width or bounds[3] > height:
        raise ValueError("The normalized mosque bounds exceed the poster dimensions.")

    result = composite(
        poster,
        background,
        bounds,
        args.min_lightness,
        args.max_saturation,
        args.min_value,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(
        str(args.output), result, [cv2.IMWRITE_JPEG_QUALITY, 96]
    ):
        raise OSError(f"Could not write output image: {args.output}")
    print(f"Saved {args.output} ({width}x{height}, JPEG quality 96)")


if __name__ == "__main__":
    main()
