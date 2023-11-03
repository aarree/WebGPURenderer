/* The controller can register callbacks for various events on a canvas:
 *
 * mousemove: function(prevMouse, curMouse, evt)
 *     receives both regular mouse events, and single-finger drags (sent as a left-click),
 *
 * press: function(curMouse, evt)
 *     receives mouse click and touch start events
 *
 * wheel: function(amount)
 *     mouse wheel scrolling
 *
 * pinch: function(amount)
 *     two finger pinch, receives the distance change between the fingers
 *
 * twoFingerDrag: function(dragVector)
 *     two finger drag, receives the drag movement amount
 */
import { vec2 } from "gl-matrix";

export class InputController {
  mousemove: ((prev: any, cur: any, evt: any) => void) | null = null;
  press: ((amt: number) => void) | null = null;
  wheel: ((amt: number) => void) | null = null;
  twoFingerDrag = null;
  pinch = null;
  registerForCanvas = function (canvas) {
    let prevMouse = null;
    // const mouseState = [false, false];
    const self = this;
    canvas.addEventListener("mousemove", function (evt) {
      evt.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const curMouse = [evt.clientX - rect.left, evt.clientY - rect.top];
      if (!prevMouse) {
        prevMouse = [evt.clientX - rect.left, evt.clientY - rect.top];
      } else if (self.mousemove) {
        self.mousemove(prevMouse, curMouse, evt);
      }
      prevMouse = curMouse;
    });

    canvas.addEventListener("mousedown", function (evt) {
      evt.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const curMouse = [evt.clientX - rect.left, evt.clientY - rect.top];
      if (self.press) {
        self.press(curMouse, evt);
      }
    });

    canvas.addEventListener("wheel", function (evt) {
      evt.preventDefault();
      if (self.wheel) {
        self.wheel(-evt.deltaY);
      }
    });

    canvas.oncontextmenu = function (evt) {
      evt.preventDefault();
    };

    const touches = {};
    canvas.addEventListener("touchstart", function (evt) {
      const rect = canvas.getBoundingClientRect();
      evt.preventDefault();
      for (let i = 0; i < evt.changedTouches.length; ++i) {
        const t = evt.changedTouches[i];
        touches[t.identifier] = [t.clientX - rect.left, t.clientY - rect.top];
        if (evt.changedTouches.length == 1 && self.press) {
          self.press(touches[t.identifier], evt);
        }
      }
    });

    canvas.addEventListener("touchmove", function (evt) {
      evt.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const numTouches = Object.keys(touches).length;
      // Single finger to rotate the camera
      if (numTouches == 1) {
        if (self.mousemove) {
          const t = evt.changedTouches[0];
          const prevTouch = touches[t.identifier];
          const curTouch = [t.clientX - rect.left, t.clientY - rect.top];
          evt.buttons = 1;
          self.mousemove(prevTouch, curTouch, evt);
        }
      } else {
        const curTouches = {};
        let t;
        for (let i = 0; i < evt.changedTouches.length; ++i) {
          t = evt.changedTouches[i];
          curTouches[t.identifier] = [
            t.clientX - rect.left,
            t.clientY - rect.top,
          ];
        }

        // If some touches didn't change make sure we have them in
        // our curTouches list to compute the pinch distance
        // Also get the old touch points to compute the distance here
        const oldTouches = [];
        for (t in touches) {
          if (!(t in curTouches)) {
            curTouches[t] = touches[t];
          }
          oldTouches.push(touches[t]);
        }

        const newTouches = [];
        for (t in curTouches) {
          newTouches.push(curTouches[t]);
        }

        // Determine if the user is pinching or panning
        const motionVectors = [
          vec2.set(
            vec2.create(),
            newTouches[0][0] - oldTouches[0][0],
            newTouches[0][1] - oldTouches[0][1],
          ),
          vec2.set(
            vec2.create(),
            newTouches[1][0] - oldTouches[1][0],
            newTouches[1][1] - oldTouches[1][1],
          ),
        ];
        const motionDirs = [vec2.create(), vec2.create()];
        vec2.normalize(motionDirs[0], motionVectors[0]);
        vec2.normalize(motionDirs[1], motionVectors[1]);

        const pinchAxis = vec2.set(
          vec2.create(),
          oldTouches[1][0] - oldTouches[0][0],
          oldTouches[1][1] - oldTouches[0][1],
        );
        vec2.normalize(pinchAxis, pinchAxis);

        const panAxis = vec2.lerp(
          vec2.create(),
          motionVectors[0],
          motionVectors[1],
          0.5,
        );
        vec2.normalize(panAxis, panAxis);

        const pinchMotion = [
          vec2.dot(pinchAxis, motionDirs[0]),
          vec2.dot(pinchAxis, motionDirs[1]),
        ];
        const panMotion = [
          vec2.dot(panAxis, motionDirs[0]),
          vec2.dot(panAxis, motionDirs[1]),
        ];

        // If we're primarily moving along the pinching axis and in the opposite direction with
        // the fingers, then the user is zooming.
        // Otherwise, if the fingers are moving along the same direction they're panning
        if (
          self.pinch &&
          Math.abs(pinchMotion[0]) > 0.5 &&
          Math.abs(pinchMotion[1]) > 0.5 &&
          Math.sign(pinchMotion[0]) != Math.sign(pinchMotion[1])
        ) {
          // Pinch distance change for zooming
          const oldDist = pointDist(oldTouches[0], oldTouches[1]);
          const newDist = pointDist(newTouches[0], newTouches[1]);
          self.pinch(newDist - oldDist);
        } else if (
          self.twoFingerDrag &&
          Math.abs(panMotion[0]) > 0.5 &&
          Math.abs(panMotion[1]) > 0.5 &&
          Math.sign(panMotion[0]) == Math.sign(panMotion[1])
        ) {
          // Pan by the average motion of the two fingers
          const panAmount = vec2.lerp(
            vec2.create(),
            motionVectors[0],
            motionVectors[1],
            0.5,
          );
          panAmount[1] = -panAmount[1];
          self.twoFingerDrag(panAmount);
        }
      }

      // Update the existing list of touches with the current positions
      for (let i = 0; i < evt.changedTouches.length; ++i) {
        const t = evt.changedTouches[i];
        touches[t.identifier] = [t.clientX - rect.left, t.clientY - rect.top];
      }
    });

    const touchEnd = function (evt) {
      evt.preventDefault();
      for (let i = 0; i < evt.changedTouches.length; ++i) {
        const t = evt.changedTouches[i];
        delete touches[t.identifier];
      }
    };
    canvas.addEventListener("touchcancel", touchEnd);
    canvas.addEventListener("touchend", touchEnd);
  };
}

const pointDist = function (a, b) {
  const v = [b[0] - a[0], b[1] - a[1]];
  return Math.sqrt(Math.pow(v[0], 2.0) + Math.pow(v[1], 2.0));
};
