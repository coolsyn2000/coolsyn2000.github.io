// Use the declared dimensions for the frame, even when the image has a different ratio.
document.querySelectorAll('.paper-box-image img[width][height]').forEach(function (image) {
  var width = Number(image.getAttribute('width'));
  var height = Number(image.getAttribute('height'));

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    image.style.setProperty('--project-image-ratio', width + ' / ' + height);
  }
});
