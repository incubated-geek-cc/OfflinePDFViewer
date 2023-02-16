var zoomOptions=[10,25,30,75,100,125,150,200,400,800,1600];
var zoomDropDownList=document.getElementById('zoomDropDownList');
for(var zoomLvl of zoomOptions) {
    var option = document.createElement('option');
    option.text = zoomLvl+'%';
    option.value = parseFloat(zoomLvl/100);
    if(parseInt(zoomLvl)==100) {
        option.selected=true;
    }
    zoomDropDownList.add(option);
}

var _PDF_DOC,
    currentPage = 1,
    noOfPages,
    _PAGE,
    _ZOOM_FACTOR = 1,
    _CANVAS = document.getElementById('pdfCanvas');

var pdfMainContainer=document.getElementById('pdfMainContainer');

var uploadPDFBtn=document.getElementById('uploadPDFBtn');
var uploadPDF=document.getElementById('uploadPDF');

uploadPDFBtn.addEventListener('click', function(evt) {
    uploadPDF.click();
});

var setActualSize=document.getElementById('setActualSize');
var setPageLevel=document.getElementById('setPageLevel');
var fitWidth=document.getElementById('fitWidth');

var tablePagination=document.getElementById('tablePagination');
var zoomPagination2=document.getElementById('zoomPagination2');
var firstPageBtn=document.getElementById('firstPageBtn');
var prevPageBtn=document.getElementById('prevPageBtn');

var nextPageBtn=document.getElementById('nextPageBtn');
var lastPageBtn=document.getElementById('lastPageBtn');

var currentPageNo=document.getElementById('currentPageNo');
var totalPages=document.getElementById('totalPages');

var downloadPageImage=document.getElementById('downloadPageImage');

downloadPageImage.addEventListener('click', (evt) => {
    let dwnlnk = document.createElement('a');
    dwnlnk.download = `${currentPage}.png`;
    dwnlnk.href = _CANVAS.toDataURL();
    dwnlnk.click();
}, false);

function readFileAsDataURL(file) {
  return new Promise((resolve,reject) => {
      let fileredr = new FileReader();
      fileredr.onload = () => resolve(fileredr.result);
      fileredr.onerror = () => reject(fileredr);
      fileredr.readAsDataURL(file);
  });
}

async function showPDF(pdf_url) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf/pdf.worker.min.js';
    var worker = new pdfjsLib.PDFWorker();
    try {
        _PDF_DOC = await pdfjsLib.getDocument({ url: pdf_url });
    } catch(error) {
        alert(error.message);
    }
    noOfPages = _PDF_DOC.numPages;
    currentPageNo.setAttribute('max', noOfPages);
    tablePagination['style']['visibility'] = 'visible';
    zoomPagination2['style']['visibility'] = 'visible';
    pdfMainContainer['style']['visibility'] = 'visible';
    totalPages.innerHTML = noOfPages;

    _PAGE=await showPage(currentPage);
    await scalePDFPage();
}

uploadPDF.addEventListener('change', function(evt) {
    let file = evt.currentTarget.files[0];
    if(!file) return;
    readFileAsDataURL(file).then((b64str) => {
        showPDF(b64str);
    }, false);
});

async function showPage(pageNo) {
    currentPage = pageNo;
    currentPageNo.value = pageNo;
    try {
        _PAGE = await _PDF_DOC.getPage(pageNo);
    } catch(error) {
        alert(error.message);
    }
    return new Promise((resolve => resolve(_PAGE)));
}

const pixelRatio=window.devicePixelRatio*2;

function resetToDefault() {
    let pdfOriginalWidth = _PAGE.getViewport(1).width;
    let viewport = _PAGE.getViewport(1);
    let viewpointHeight=viewport.height;

    _CANVAS.width=pdfOriginalWidth*pixelRatio;
    _CANVAS.height=viewpointHeight*pixelRatio;

    _CANVAS['style']['width'] = `${pdfOriginalWidth}px`;
    _CANVAS['style']['height'] = `${viewpointHeight}px`;

    pdfMainContainer['style']['width'] = `${pdfOriginalWidth}px`;
    pdfMainContainer['style']['height'] = `${viewpointHeight}px`;

    _CANVAS.getContext('2d').scale(pixelRatio, pixelRatio);
}

async function scalePDFPage() {
    _CANVAS['style']['visibility'] = 'hidden';
    
    let pdfOriginalWidth = _PAGE.getViewport(_ZOOM_FACTOR).width;
    let viewport = _PAGE.getViewport(_ZOOM_FACTOR);
    let viewpointHeight=viewport.height;

    _CANVAS.width=pdfOriginalWidth*pixelRatio;
    _CANVAS.height=viewpointHeight*pixelRatio;

    _CANVAS['style']['width'] = `${pdfOriginalWidth}px`;
    _CANVAS['style']['height'] = `${viewpointHeight}px`;

    pdfMainContainer['style']['width'] = `${pdfOriginalWidth}px`;
    pdfMainContainer['style']['height'] = `${viewpointHeight}px`;

    _CANVAS.getContext('2d').scale(pixelRatio, pixelRatio);

    var renderContext = {
        canvasContext: _CANVAS.getContext('2d'),
        viewport: viewport
    };
    try {
        await _PAGE.render(renderContext);
    } catch(error) {
        alert(error.message);
    }
    _CANVAS['style']['visibility'] = 'visible';
    return new Promise((resolve => resolve('success')));
}

fitWidth.addEventListener('click', async(evt)=> {
    resetToDefault();
    let requiredWidth=`${window.outerWidth-30}`;
    _ZOOM_FACTOR=requiredWidth/parseFloat(_CANVAS.style.width.replace('px',''));
    _PAGE=await showPage(currentPage);
    await scalePDFPage();
}, false);

setPageLevel.addEventListener('click', async(evt)=> {
    resetToDefault();
    let requiredHeight=`${document.getElementById('pdfFullContainer').clientHeight-30}`;
    _ZOOM_FACTOR=requiredHeight/parseFloat(_CANVAS.style.height.replace('px',''));

    _PAGE=await showPage(currentPage);
    await scalePDFPage();
}, false);

setActualSize.addEventListener('click', async(evt)=> {
    _ZOOM_FACTOR=1;
    _PAGE=await showPage(currentPage);
    await scalePDFPage();
    zoomDropDownList.value=_ZOOM_FACTOR+'';
}, false);

zoomDropDownList.addEventListener('change', async(evt)=> {
    resetToDefault();
    _ZOOM_FACTOR=parseFloat(evt.target.value);
    _PAGE=await showPage(currentPage);
    await scalePDFPage();
}, false);

async function setPaginationClass() {
    currentPageNo.value=currentPage;

    _PAGE=await showPage(currentPage);
    await scalePDFPage();

    if(currentPage==1) {
        if(!firstPageBtn.classList.contains('disabled')) {
            firstPageBtn.classList.add('disabled');
        }
        if(!prevPageBtn.classList.contains('disabled')) {
            prevPageBtn.classList.add('disabled');
        }
    } else if(currentPage>1) {
        if(firstPageBtn.classList.contains('disabled')) {
            firstPageBtn.classList.remove('disabled');
        }
        if(prevPageBtn.classList.contains('disabled')) {
            prevPageBtn.classList.remove('disabled');
        }
    }
    if(currentPage==noOfPages) {
        if(!nextPageBtn.classList.contains('disabled')) {
            nextPageBtn.classList.add('disabled');
        }
        if(!lastPageBtn.classList.contains('disabled')) {
            lastPageBtn.classList.add('disabled');
        }
    } else if(currentPage<noOfPages) {
        if(nextPageBtn.classList.contains('disabled')) {
            nextPageBtn.classList.remove('disabled');
        }
        if(lastPageBtn.classList.contains('disabled')) {
            lastPageBtn.classList.remove('disabled');
        }
    }
};
currentPageNo.addEventListener('change', (evt0) => {
    currentPage=parseInt(evt0.target.value);
    setPaginationClass();
});
firstPageBtn.addEventListener('click', () => {
    currentPage=1;
    setPaginationClass();
});
prevPageBtn.addEventListener('click', () => {
    if(currentPage>1) {
        currentPage=currentPage-1;
        setPaginationClass();
    }
});
nextPageBtn.addEventListener('click', () => {
    if(currentPage<noOfPages) {
        currentPage=currentPage+1;
        setPaginationClass();
    }
});
lastPageBtn.addEventListener('click', () => {
    currentPage=noOfPages;
    setPaginationClass();
});