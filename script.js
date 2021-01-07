const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)


async function start() {
  /* creamos un nuevo elemento div */
  const container = document.createElement('div');
  /* posicion relativa del div contenedor, para un constante movimient*/
  container.style.position = 'relative';
  /* ponemos el contenedor en el body */
  document.body.append(container);

  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  let image;
  let canvas;

  document.body.append('Loaded');
  /* cada que se mueva el rostro significa un cambio */
  imageUpload.addEventListener('change',
    async () => {

      if (image) image.remove();
      if (canvas) canvas.remove();

      image = await faceapi.bufferToImage(imageUpload.files[0]);
      /* el cambio se aplica dentro del contenedor */
      container.append(image);
      /* crea canvas desde imagen statica */
      canvas = faceapi.createCanvasFromMedia(image);
      /* ese canvas tambien se genera cambio dentro de contenedor */
      container.append(canvas);
      const displaySize = { width: image.width, height: image.height };
      faceapi.matchDimensions(canvas, displaySize)
      const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

      results.forEach(
        (result, i) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
          drawBox.draw(canvas);
        }
      );
    }
  );
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark'];
  return Promise.all(
    labels.map(
      async label => {
        const descriptions = []
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`);
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          descriptions.push(detections.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions)
      }
    )
  );
}


