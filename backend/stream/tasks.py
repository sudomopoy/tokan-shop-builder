"""
تبدیل ویدیوی آپلودشده به HLS با ffmpeg.
"""
import logging
import os
import subprocess
from pathlib import Path

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, name="stream.process_video_to_hls")
def process_video_to_hls_task(self, product_id: str):
    """
    ویدیوی محصول را به HLS تبدیل و مسیر را ذخیره می‌کند.
    """
    from product.models import Product

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        logger.error("Product %s not found", product_id)
        return {"success": False, "error": "Product not found"}

    if product.streaming_source != "uploaded" or not product.streaming_video_id:
        logger.warning("Product %s not configured for HLS upload", product_id)
        return {"success": False, "error": "Not an uploaded streaming product"}

    media = product.streaming_video
    if not media or not media.file:
        logger.error("No video file for product %s", product_id)
        return {"success": False, "error": "No video file"}

    # مسیر فایل منبع
    if hasattr(media.file, "path"):
        input_path = media.file.path
    else:
        input_path = str(media.file)
        if not os.path.isabs(input_path):
            input_path = os.path.join(settings.MEDIA_ROOT, input_path)
    if not os.path.exists(input_path):
        logger.error("Video file not found: %s", input_path)
        return {"success": False, "error": "Video file not found"}

    # پوشه خروجی HLS
    output_dir = os.path.join(settings.MEDIA_ROOT, "hls", str(product_id))
    os.makedirs(output_dir, exist_ok=True)
    output_manifest = os.path.join(output_dir, "master.m3u8")

    # ffmpeg command برای HLS
    cmd = [
        "ffmpeg",
        "-i", input_path,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-hls_time", "6",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", os.path.join(output_dir, "segment_%03d.ts"),
        "-f", "hls",
        output_manifest,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        if result.returncode != 0:
            logger.error("ffmpeg failed: %s", result.stderr)
            return {"success": False, "error": result.stderr[:500]}
    except subprocess.TimeoutExpired:
        logger.error("ffmpeg timeout for product %s", product_id)
        return {"success": False, "error": "Processing timeout"}
    except FileNotFoundError:
        logger.error("ffmpeg not found - install ffmpeg")
        return {"success": False, "error": "ffmpeg not installed"}
    except Exception as e:
        logger.exception("ffmpeg error: %s", e)
        return {"success": False, "error": str(e)}

    # ذخیره مسیر HLS در محصول
    product.streaming_hls_path = output_dir
    product.save(update_fields=["streaming_hls_path"])

    logger.info("HLS processing complete for product %s: %s", product_id, output_dir)
    return {"success": True, "path": output_dir}
