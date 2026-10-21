class HorizonLock {
  constructor(element) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.currentRoll = 0;
    this.isActive = false;

    // Bind methods to maintain 'this' context
    this.handleOrientation = this.handleOrientation.bind(this);
    this.updateLoop = this.updateLoop.bind(this);
  }

  async start() {
    if (this.isActive) return true;

    try {
      // iOS 13+ requires explicit permission request
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState !== 'granted') {
          console.warn('Permission to access device orientation was denied.');
          return false;
        }
      }

      window.addEventListener('deviceorientation', this.handleOrientation);
      this.isActive = true;
      
      requestAnimationFrame(this.updateLoop);
      return true;
    } catch (error) {
      console.error('DeviceOrientation is not supported or encountered an error:', error);
      return false;
    }
  }

  /* Stops tracking the gyroscope. */
  stop() {
    if (!this.isActive) return;
    window.removeEventListener('deviceorientation', this.handleOrientation);
    this.isActive = false;
    
    // Reset element rotation
    if (this.element) {
      this.element.style.transform = 'rotate(0deg)';
    }
  }


  handleOrientation(event) {
    // 'gamma' left to right tilt (roll)
    // 'beta' front to back tilt (pitch)
    let roll = event.gamma; 

    // Handle landscape orientation adjustments if the device is flipped sideways
    if (window.orientation === 90) {
      roll = event.beta;
    } else if (window.orientation === -90) {
      roll = -event.beta;
    }

    this.currentRoll = -roll;
  }

  updateLoop() {
    if (!this.isActive) return;

    if (this.element) {
      // Apply counter-rotation strictly around the default center point
      this.element.style.transform = `rotate(${this.currentRoll}deg)`;
    }

    requestAnimationFrame(this.updateLoop);
  }
}

document.querySelectorAll(".lock").forEach(HorizonLock);
