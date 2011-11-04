var SCWaveform;
var SCgetCanvas;
$(function(){
  SCgetCanvas = function(node) {
  var canvas = $(node).filter('canvas')[0];
  // initalize the canvas to be used in IE
  if (typeof window.G_vmlCanvasManager !== "undefined") {
     canvas = window.G_vmlCanvasManager.initElement(canvas);
     var oldGetContext = canvas.getContext;
     canvas.getContext = function(a) {
       var ctx = oldGetContext.apply(canvas, arguments);
       // monkey patch the excanvas, it will make sure that even the hidden canvases have the correct height
       $('div', canvas).height(canvas.getAttribute('height'));
       canvas.getContext = oldGetContext;
       return ctx;
     };
  }
  return canvas;
};

SCWaveform = function() {
  var levelInt,
      // sampling rate, adjust it for slower browsers
      frames = 25,
      rate = Math.floor(1000/frames),
      currentTime = 0,
      // store the recorded levels in the array
      levels = [],
      // fake values smaller than 1, makes normalized waveform nicer
      enrich = function(val) {
        return val < 1 ? Math.random() : val;
      },
      // normalize values to look more like SoundCloud waveform
      normalize = function(x, max) {
        var scale = 0.25,
        normed = (Math.pow(x, scale) / Math.pow(max, scale)) * max;
        return normed;
      },
      // the canvas where we'll draw the waveform
      wfCanvas = SCgetCanvas($('canvas.levels')),
      ctx = wfCanvas.getContext('2d'),
      ctxWidth = parseInt(ctx.canvas.width, 10),
      wfWidth = ctxWidth,// - 40,
      ctxHeight = parseInt(ctx.canvas.height, 10),
      draw = function(scaleToFit, noCounter) {
        var total = levels.length,
            // draw the time counter, use measureText()
            counterX = (scaleToFit ? wfWidth : Math.min(wfWidth, total)) + 5,
            // check if we need to scale the waveform to fit
            scale = scaleToFit && wfWidth > total ? wfWidth/total : 1;
  
        // clear the area
        ctx.clearRect(0, 0, ctxWidth, ctxHeight);
        // reset canvas before drawing
        // draw the waveform
        ctx.fillStyle = '#333';
        // draw the waveform, make it fit in the canvas
        for (var i = 0 , startOffset = Math.max(0, total - wfWidth), l = Math.min(total, wfWidth); i < l; i += 1){
          // map the waveform amplitude
          var v = Math.round(normalize(levels[startOffset + i], ctxHeight)),
              x = Math.ceil(i * scale),
              width = Math.ceil(scale),
              // center the levels vertically
              diff = Math.round((ctxHeight - v)/2);
          ctx.fillRect(x, diff, width, v);
        }
        // draw the counter
        if(!noCounter && total > 0){
          //drawCounter(ctx, counterX, currentTime);
        }
      },
      interpolate = function() {
        var total = levels.length,
        step = total/wfWidth,
        interpolated = [],
        avg = 0,
        i = 0,
        sauce = function() {
          var min = 0.85,
              max = 1.3,
              diff = max - min;
          return min + Math.random() * diff;
        };
        // reduce/increase the total levels to fit in the canvas
        if(step < 1){
          // we'll stretch the waveform nicely
          var c = 0;
          while(i < wfWidth){
            // we have too little data, so we'll add some sauce to it
            interpolated.push(levels[Math.round(c)] * sauce());
            // keep iterating
            i += 1;
            c += step;
          }
        }else{
          // we'll condense the waveform
          step = Math.floor(step);
          while(i < total){
            // accumulate the average
            avg += levels[i];
            if(i % step === 0){
              // find out the average value for the step
              interpolated.push(avg/step);
              avg = 0;
            }
            i += 1;
          }
        }
        return interpolated;
      },
      reset = function() {
        levels = [];
        currentTime = 0;
      };
  
  return {
    getLevels: function(){
      return levels;
    },
    draw: function(time, level){
      var val = enrich(level);
      levels.push(val);
      currentTime = time;
      draw();
    },
    
    finishedDraw: function(){
      levels = interpolate();
      // reset the current time
      currentTime = 0;
      // render the waveform, scale if needed, no counter needed
      draw(true, true);
    },
    
    start: function() {
      reset();
      levelInt = setInterval(function() {
        var val = enrich(flash.api_levelIn());
        levels.push(val);
        currentTime = flash.api_bufferDuration();
        draw();
        }, rate);
      },
      stop: function() {
        // stop drawing the real-time waveform
        clearInterval(levelInt);
        levelInt = null;
      },
      reset: function() {
        reset();
        draw();
      },
      render: function() {
        this.stop();
        // replace the levels with the interpolated version
        levels = interpolate();
        // reset the current time
        currentTime = 0;
        // render the waveform, scale if needed, no counter needed
        draw(true, true);
      }
    };
}();

});