
window.addEventListener('DOMContentLoaded', (event) => {


    const squaretable = {} // this section of code is an optimization for use of the hypotenuse function on Line and LineOP objects
    for (let t = 0; t < 10000000; t++) {
        squaretable[`${t}`] = Math.sqrt(t)
        if (t > 999) {
            t += 9
        }
    }
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their valueOfs to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received valueOfs
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    TIP_engine.x = 350
    TIP_engine.y = 350
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }

    class Vector { // vector math and physics if you prefer this over vector components on circles
        constructor(object = (new Point(0, 0)), xmom = 0, ymom = 0) {
            this.xmom = xmom
            this.ymom = ymom
            this.object = object
        }
        isToward(point) {
            let link = new LineOP(this.object, point)
            let dis1 = link.sqrDis()
            let dummy = new Point(this.object.x + this.xmom, this.object.y + this.ymom)
            let link2 = new LineOP(dummy, point)
            let dis2 = link2.sqrDis()
            if (dis2 < dis1) {
                return true
            } else {
                return false
            }
        }
        rotate(angleGoal) {
            let link = new Line(this.xmom, this.ymom, 0, 0)
            let length = link.hypotenuse()
            let x = (length * Math.cos(angleGoal))
            let y = (length * Math.sin(angleGoal))
            this.xmom = x
            this.ymom = y
        }
        magnitude() {
            return (new Line(this.xmom, this.ymom, 0, 0)).hypotenuse()
        }
        normalize(size = 1) {
            let magnitude = this.magnitude()
            this.xmom /= magnitude
            this.ymom /= magnitude
            this.xmom *= size
            this.ymom *= size
        }
        multiply(vect) {
            let point = new Point(0, 0)
            let end = new Point(this.xmom + vect.xmom, this.ymom + vect.ymom)
            return point.pointDistance(end)
        }
        add(vect) {
            return new Vector(this.object, this.xmom + vect.xmom, this.ymom + vect.ymom)
        }
        subtract(vect) {
            return new Vector(this.object, this.xmom - vect.xmom, this.ymom - vect.ymom)
        }
        divide(vect) {
            return new Vector(this.object, this.xmom / vect.xmom, this.ymom / vect.ymom) //be careful with this, I don't think this is right
        }
        draw() {
            let dummy = new Point(this.object.x + this.xmom, this.object.y + this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            link.draw()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        squareDistance() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if (hypotenuse < 10000000 - 1) {
                if (hypotenuse > 1000) {
                    return squaretable[`${Math.round(10 * Math.round((hypotenuse * .1)))}`]
                } else {
                    return squaretable[`${Math.round(hypotenuse)}`]
                }
            } else {
                return Math.sqrt(hypotenuse)
            }
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        squareDistance() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if (hypotenuse < 10000000 - 1) {
                if (hypotenuse > 1000) {
                    return squaretable[`${Math.round(10 * Math.round((hypotenuse * .1)))}`]
                } else {
                    return squaretable[`${Math.round(hypotenuse)}`]
                }
            } else {
                return Math.sqrt(hypotenuse)
            }
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    }
    class CircleRing {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = 10
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        draw() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].draw()
            }
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        innerShape(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return this.shapes[t]
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        adjustByFromDisplacement(x, y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (typeof this.shapes[t].fromRatio == "number") {
                    this.shapes[t].x += x * this.shapes[t].fromRatio
                    this.shapes[t].y += y * this.shapes[t].fromRatio
                }
            }
        }
        adjustByToDisplacement(x, y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (typeof this.shapes[t].toRatio == "number") {
                    this.shapes[t].x += x * this.shapes[t].toRatio
                    this.shapes[t].y += y * this.shapes[t].toRatio
                }
            }
        }
        mixIn(arr) {
            for (let t = 0; t < arr.length; t++) {
                for (let k = 0; k < arr[t].shapes.length; k++) {
                    this.shapes.push(arr[t].shapes[k])
                }
            }
        }
        push(object) {
            this.shapes.push(object)
        }
    }

    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
        }
        balance() {
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += ((this.body.x - this.anchor.x) / this.length)
                this.body.ymom += ((this.body.y - this.anchor.y) / this.length)
                this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length)
                this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length)
            } else if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
            }

            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, size, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.points = []
            this.flop = 0
            let angle = 0
            this.size = size
            let line = new Line((Math.cos(angle) * size), (Math.sin(angle) * size), (Math.cos(angle + ((Math.PI * 2) / members)) * size), (Math.sin(angle + ((Math.PI * 2) / members)) * size))
            let distance = line.hypotenuse()
            for (let t = 0; t < members; t++) {
                let circ = new Circle(x + (Math.cos(angle) * size), y + (Math.sin(angle) * size), radius, color)
                circ.reflect = 1
                circ.bigbody = new Circle(x + (Math.cos(angle) * size), y + (Math.sin(angle) * size), distance, color)
                circ.draw()
                circ.touch = []
                this.points.push(circ)
                angle += ((Math.PI * 2) / members)
            }

            for (let t = 0; t < this.points.length; t++) {
                for (let k = 0; k < this.points.length; k++) {
                    if (t != k) {
                        if (this.points[k].bigbody.doesPerimeterTouch(this.points[t])) {
                            if (!this.points[k].touch.includes(t) && !this.points[t].touch.includes(k)) {
                                let spring = new SpringOP(this.points[k], this.points[t], (size * Math.PI) / members, 2, color)
                                this.points[k].touch.push(t)
                                this.points[t].touch.push(k)
                                this.springs.push(spring)
                                spring.beam.draw()
                            }
                        }
                    }
                }
            }

            console.log(this)

            // this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            // this.springs.push(this.spring)
            // for (let k = 0; k < members; k++) {
            //     this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
            //     if (k < members - 1) {
            //         this.springs.push(this.spring)
            //     } else {
            //         this.spring.anchor = this.pin
            //         this.springs.push(this.spring)
            //     }
            // }
            this.forceConstant = force
            this.centroid = new Circle(0, 0, 10, "red")
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.points.length; t++) {
                this.points[t].x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.points[t].y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.points.length; s++) {
                this.xpoint += (this.points[s].x / this.points.length)
                this.ypoint += (this.points[s].y / this.points.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            // this.centroid.x += TIP_engine.x / this.points.length
            // this.centroid.y += TIP_engine.y / this.points.length
            for (let s = 0; s < this.points.length; s++) {
                this.link = new LineOP(this.points[s], this.centroid, 0, "transparent")
                if (this.link.hypotenuse() != 0) {

                    if (this.size < this.link.hypotenuse()) {
                        this.points[s].xmom -= (Math.cos(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                        this.points[s].ymom -= (Math.sin(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                    } else {
                        this.points[s].xmom += (Math.cos(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                        this.points[s].ymom += (Math.sin(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                    }

                    // this.points[s].xmom += (((this.points[s].x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    // this.points[s].ymom += (((this.points[s].y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            if (this.flop % 2 == 0) {
                for (let s = 0; s < this.springs.length; s++) {
                    this.springs[s].balance()
                }
            } else {
                for (let s = this.springs.length - 1; s >= 0; s--) {
                    this.springs[s].balance()
                }
            }
            for (let s = 0; s < this.points.length; s++) {
                this.points[s].move()
                this.points[s].draw()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
            this.centroid.draw()
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 1)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
        });
        window.addEventListener('pointermove', continued_stimuli);

        window.addEventListener('pointerup', e => {
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        //         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.x += (gamepadAPI.axesStatus[0] * speed)
                    object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.x += (gamepadAPI.axesStatus[0] * speed)
                    object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
            circ.toRatio = t / limit
            circ.fromRatio = (limit - t) / limit
            shape_array.push(circ)
        }
        return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 


    class Perceptron {
        constructor(inputs) {
            this.bias = 0// this.weight()/100
            this.value = this.bias
            this.weights = []
            this.inputs = inputs
            for (let t = 0; t < this.inputs.length; t++) {
                this.weights.push(this.weight())
            }
        }
        weight() {
            return Math.random() 
        }
        valueOf() {
            return this.value
        }
        compute(inputs = this.inputs) {
            this.inputs = inputs
            this.value = this.bias
            for (let t = 0; t < inputs.length; t++) {
                if (t > this.weights.length - 1) {
                    this.weights.push(this.weight())
                    this.value += (inputs[t].valueOf() * this.weights[t])
                } else {
                    this.value += (inputs[t].valueOf() * this.weights[t])
                }
            }
            // this.relu()
            return this.value
        }
        relu() {
            this.value = Math.max(this.value, 0)
        }
    }
    class Network {
        constructor(inputs, layerSetupArray) {
            this.setup = layerSetupArray
            this.inputs = inputs
            this.structure = []
            this.outputs = []
            for (let t = 0; t < layerSetupArray.length; t++) {
                this.scaffold = []
                for (let k = 0; k < layerSetupArray[t]; k++) {
                    let cept
                    if (t == 0) {
                        cept = new Perceptron(this.inputs)
                    } else {
                        cept = new Perceptron(this.structure[t - 1])
                    }
                    this.scaffold.push(cept)
                }
                this.structure.push(this.scaffold)
            }
        }

        clone(nw) {
            let input = [0,0,0,0,0,0,0]
            let perc = new Network(input,  nw.setup)
            for (let t = 0; t < nw.structure.length; t++) {
                for (let k = 0; k < nw.structure[t].length; k++) {
                    perc.structure[t][k] = new Perceptron([0,0,0,0,0,0,0])
                    for (let f = 0; f < nw.structure[t][k].weights.length; f++) {
                        perc.structure[t][k].weights[f] = nw.structure[t][k].weights[f]
                        perc.structure[t][k].bias = nw.structure[t][k].bias
                    }
                }
            }
            // console.log(perc)
            return perc
        }

        compute(inputs = this.inputs) {
            this.inputs = inputs
            for (let t = 0; t < this.structure.length; t++) {
                for (let k = 0; k < this.structure[t].length; k++) {
                    this.structure[t][k].compute(this.inputs)
                }
            }
            this.outputs = []
            this.dataoutputs = []
            for (let t = 0; t < this.structure[this.structure.length - 1].length; t++) {
                this.outputs.push(this.structure[this.structure.length - 1][t].valueOf())
                this.dataoutputs.push(new Data(this.structure[this.structure.length - 1][t].valueOf()))
            }
        }
        errorCheck(goals) {
            let sum = 0
            for (let t = 0; t < goals.length; t++) {
                sum += ((goals[t] - this.outputs[t]) * ((goals[t] - this.outputs[t])))
            }
            return sum
        }
        mutate(){

            let perceptronLayer = Math.floor(Math.random() * this.structure.length)
            let perceptronNumber = Math.floor(Math.random() * this.structure[perceptronLayer].length)
            if(typeof this.structure[perceptronLayer][perceptronNumber] == "undefined" ){
                console.log(this)
                return
            }
            let perceptronWeightNumber = Math.floor(Math.random() * this.structure[perceptronLayer][perceptronNumber].weights.length)
            this.structure[perceptronLayer][perceptronNumber].weights[perceptronWeightNumber] += this.structure[perceptronLayer][perceptronNumber].weight()/2
        }
        mutateTowards(goals) {
            this.compute(this.inputs)
            this.error1 = this.errorCheck(goals)
            let perceptronLayer = Math.floor(Math.random() * this.structure.length)
            let perceptronNumber = Math.floor(Math.random() * this.structure[perceptronLayer].length)
            let perceptronWeightNumber = Math.floor(Math.random() * this.structure[perceptronLayer][perceptronNumber].weights.length)
            let storage = this.structure[perceptronLayer][perceptronNumber].weights[perceptronWeightNumber]
            this.structure[perceptronLayer][perceptronNumber].weights[perceptronWeightNumber] = this.structure[perceptronLayer][perceptronNumber].weight()
            this.compute(this.inputs)
            this.error2 = this.errorCheck(goals)
            if (this.error1 < this.error2) {
                this.structure[perceptronLayer][perceptronNumber].weights[perceptronWeightNumber] = storage
                this.compute(this.inputs)
            }
        }
    }
    class Data {
        constructor(input = -100) {
            if (input == -100) {
                this.value = this.weight()
            } else {
                this.value = input
            }
        }
        valueOf() {
            return this.value
        }
        weight() {
            return Math.random() - .5
        }
    }
    let inputs = []
    for (let t = 0; t < 20; t++) {
        inputs.push(new Data())
    }
    let percs = []
    for (let t = 0; t < 10; t++) {
        let perc = new Network(inputs, [40, 20, 10, 2])
        perc.compute()
        percs.push(perc)
    }
    TIP_engine.x = 350
    TIP_engine.y = 350
    let goals = [TIP_engine.x, TIP_engine.y]// goals = [0,.1,.2,.3,.4,.5,.6,.7,.8,.9]


    class Cell {
        constructor(x, y, r, g, b) {
            this.age = 0
            this.r = r
            this.g = g
            this.b = b
            this.links = []
            this.flinks = []
            this.body = new Circle(x, y, 3 + (Math.random() - .5), `rgb(${this.r},${this.g},${this.b})`)
            this.inputs = [0, 0, 0, 0, 0, 0, 0]
            let structure = []
            let height = Math.floor(Math.random() * 5) + 1
            for (let t = 0; t < height; t++) {
                structure.push(Math.floor(Math.random() * (10 - t)) + 2)
            }
            structure.push(4)
            this.net = new Network(this.inputs, structure)
            this.children = []
            this.parents = []
            this.totalage = 0
            this.gen = 1
        }
        gatherInfo() {
            this.inputs = [0,0,0,0,0,0,0] //7
            let min = 999999999999
            for (let t = 0; t < cells.length; t++) {

                if (this.children.includes(cells[t])) {

                } else if (this.parents.includes(cells[t])) {

                }else if (cells[t].parents.includes(this)) {

                }else if (cells[t].children.includes(this)) {

                }  else {
                if (this != cells[t]) {
                    if (typeof this.links[t] == 'undefined') {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    } else if (this.links[t].target != cells[t].body) {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    }
                    if (this.links[t].hypotenuse() < min) {
                        min = this.links[t].hypotenuse()
                        this.inputs[0] = 1-((cells[t].body.x - this.body.x) /  this.links[t].hypotenuse())
                        this.inputs[1] = 1-((cells[t].body.y - this.body.y) /  this.links[t].hypotenuse())
                        this.inputs[2] = (cells[t].body.radius - this.body.radius) * 2
                    }
                }
            }
            }
            min = 999999999999
            for (let t = 0; t < foods.length; t++) {
                if (this != foods[t]) {
                    if (typeof this.flinks[t] == 'undefined') {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    } else if (this.flinks[t].target != foods[t]) {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    }
                    if (this.flinks[t].hypotenuse() < min) {
                        min = this.flinks[t].hypotenuse()
                        // this.inputs[3] = (foods[t].x - this.body.x) / 350
                        // this.inputs[4] = (foods[t].y - this.body.y) / 350
                        // this.inputs[3] =  (350-(foods[t].x - this.body.x)) / 700
                        // this.inputs[4] =  (350-(foods[t].y - this.body.y)) / 700

                        this.inputs[3] =  1-(((foods[t].x - this.body.x)) / this.flinks[t].hypotenuse())
                        this.inputs[4] =  1-(((foods[t].y - this.body.y)) /  this.flinks[t].hypotenuse())
                    }
                }
            }
            this.inputs[5] =  0 //(this.body.x - 400) / 400
            this.inputs[6] = 0// (this.body.y - 400) / 400
        }
        faceLie() {
            let line2
            this.inputs = [0,0,0,0,0,0,0]
            let min = 999999999999
            for (let t = 0; t < cells.length; t++) {

                if (this.children.includes(cells[t])) {

                } else if (this.parents.includes(cells[t])) {

                }else if (cells[t].parents.includes(this)) {

                }else if (cells[t].children.includes(this)) {

                }  else {
                if (this != cells[t]) {
                    if (typeof this.links[t] == 'undefined') {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    } else if (this.links[t].target != cells[t].body) {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    }
                    if (this.links[t].hypotenuse() < min) {
                        min = this.links[t].hypotenuse()

                        this.inputs[0] = 1-((cells[t].body.x - this.body.x) /  this.links[t].hypotenuse())
                        this.inputs[1] = 1-((cells[t].body.y - this.body.y) /  this.links[t].hypotenuse())
                        // this.inputs[0] = (cells[t].body.x - this.body.x) / 400
                        // this.inputs[1] = (cells[t].body.y - this.body.y) / 400
                        this.inputs[2] = (cells[t].body.radius - this.body.radius) * 2

                        line2 = new LineOP(this.body, cells[t].body, "cyan", .5)
                    }
                }
            }
            }
            min = 999999999999
            for (let t = 0; t < foods.length; t++) {
                if (this != foods[t]) {
                    if (typeof this.flinks[t] == 'undefined') {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    } else if (this.flinks[t].target != foods[t]) {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    }
                    if (this.flinks[t].hypotenuse() < min) {
                        min = this.flinks[t].hypotenuse()
                        this.inputs[3] =  0 // (foods[t].x - this.body.x) / 350
                        this.inputs[4] = 0 // (foods[t].y - this.body.y) / 350
                    }
                }
            }
            if(typeof line2 == 'undefined'){
                line2 = new LineOP(this.body, cells[0].body, "cyan", .5)
            }
            line2.draw()
            this.inputs[5] =  0 //(this.body.x - 350) / 350
            this.inputs[6] = 0 //(this.body.y - 350) / 350
            this.net.compute(this.inputs)
            let line = new Line(this.body.x,this.body.y, this.body.x +  (this.net.outputs[0] - this.net.outputs[1])*20, this.body.y +(this.net.outputs[2] - this.net.outputs[3])*20, "red",1.5)
            // console.log(line)
            line.draw()
        }
        bodyLie() {
            this.inputs = [0,0,0,0,0,0,0]
            let min = 999999999999
            for (let t = 0; t < cells.length; t++) {
                if (this.children.includes(cells[t])) {

                } else if (this.parents.includes(cells[t])) {

                }else if (cells[t].parents.includes(this)) {

                }else if (cells[t].children.includes(this)) {

                } else {
                if (this != cells[t]) {
                    if (typeof this.links[t] == 'undefined') {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    } else if (this.links[t].target != cells[t].body) {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    }
                    if (this.links[t].hypotenuse() < min) {
                        min = this.links[t].hypotenuse()
                        this.inputs[0] = 0// (cells[t].body.x - this.body.x) / 350
                        this.inputs[1] = 0//(cells[t].body.y - this.body.y) / 350
                        this.inputs[2] = 0// (cells[t].body.radius - this.body.radius) * 2
                    }
                }
            }
            }
            min = 999999999999
            let line2 
            for (let t = 0; t < foods.length; t++) {
                if (this != foods[t]) {
                    if (typeof this.flinks[t] == 'undefined') {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    } else if (this.flinks[t].target != foods[t]) {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    }
                    if (this.flinks[t].hypotenuse() < min) {
                        min = this.flinks[t].hypotenuse()

                        this.inputs[3] =  1-(((foods[t].x - this.body.x)) / this.flinks[t].hypotenuse())
                        this.inputs[4] =  1-(((foods[t].y - this.body.y)) /  this.flinks[t].hypotenuse())
                        // this.inputs[3] =  ((foods[t].x - this.body.x)) / 800
                        // this.inputs[4] =  ((foods[t].y - this.body.y)) / 800
                        line2 = new LineOP(this.body, foods[t], "yellow", .5)
                    }
                }
            }

            if(typeof line2 == 'undefined'){
                line2 = new LineOP(this.body, cells[0].body, "cyan", .5)
            }
            line2.draw()
            this.inputs[5] =  0 //(this.body.x - 350) / 350
            this.inputs[6] = 0 //(this.body.y - 350) / 350
            this.net.compute(this.inputs)
            let line = new Line(this.body.x,this.body.y, this.body.x +  (this.net.outputs[0] - this.net.outputs[1])*20, this.body.y +(this.net.outputs[2] - this.net.outputs[3])*20, "#00ff00",1.5)
            line.draw()
        }
        mindLie() {
            this.inputs = [0,0,0,0,0,0,0]
            let min = 999999999999
            for (let t = 0; t < cells.length; t++) {

                if (this.children.includes(cells[t])) {

                } else if (this.parents.includes(cells[t])) {

                }else if (cells[t].parents.includes(this)) {

                }else if (cells[t].children.includes(this)) {

                }  else {
                if (this != cells[t]) {
                    if (typeof this.links[t] == 'undefined') {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    } else if (this.links[t].target != cells[t].body) {
                        this.links[t] = new LineOP(this.body, cells[t].body)
                    }
                    if (this.links[t].hypotenuse() < min) {
                        min = this.links[t].hypotenuse()
                        this.inputs[0] = 0// (cells[t].body.x - this.body.x) / 350
                        this.inputs[1] = 0//(cells[t].body.y - this.body.y) / 350
                        this.inputs[2] = 0// (cells[t].body.radius - this.body.radius) * 2
                    }
                }
            }
            }
            min = 999999999999
            for (let t = 0; t < foods.length; t++) {
                if (this != foods[t]) {
                    if (typeof this.flinks[t] == 'undefined') {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    } else if (this.flinks[t].target != foods[t]) {
                        this.flinks[t] = new LineOP(this.body, foods[t])
                    }
                    if (this.flinks[t].hypotenuse() < min) {
                        min = this.flinks[t].hypotenuse()
                        this.inputs[3] =  0//(foods[t].x - this.body.x) / 350
                        this.inputs[4] =  0//(foods[t].y - this.body.y) / 350
                    }
                }
            }
            this.inputs[5] =  (this.body.x - 400) / 400
            this.inputs[6] = (this.body.y - 400) / 400
            this.net.compute(this.inputs)
            let line = new Line(this.body.x,this.body.y, this.body.x +  (this.net.outputs[0] - this.net.outputs[1])*20, this.body.y +(this.net.outputs[2] - this.net.outputs[3])*20, "white",1)
            line.draw()
        }
        compute() {
            this.net.compute(this.inputs)
            this.age++
            if(cells.length> 100){
                this.age++
            }
            if(cells.length> 200){
                this.age++
            }
            if(cells.length> 210){
                this.age++
            }
            if(cells.length> 220){
                this.age++
            }
            if(cells.length> 230){
                this.age+=(Math.random()*10)
            }
            this.totalage++
        }
        draw() {
            if(Math.random() < .01){
                this.parents = []
                this.children = []
            }
            if(this.age > 2500){
                this.marked = 1
            }
            this.body.xmom += (this.net.outputs[0] - this.net.outputs[1])/1
            this.body.ymom += (this.net.outputs[2] - this.net.outputs[3])/1
            this.body.friction = 0
            // this.body.reflect = 1
            this.body.frictiveMove()

            if (this.body.x < 0) {
                this.body.x = canvas.width
                // this.marked = 1
                this.age+=300+(Math.floor(Math.random()*10))
            }
            if (this.body.y < 0) {
                this.body.y = canvas.width
                // this.marked = 1
                this.age+=300+(Math.floor(Math.random()*10))
            }
            if (this.body.x > canvas.width) {
                this.body.x =  0 //canvas.width
                // this.marked = 1
                this.age+=300+(Math.floor(Math.random()*10))
            }
            if (this.body.y > canvas.width) {
                this.body.y =  0 //canvas.width
                // this.marked = 1
                this.age+=300+(Math.floor(Math.random()*10))
            }
            this.body.draw()
        }
        hunt() {

            for (let t = 0; t < cells.length; t++) {
                if (this != cells[t]) {
                        if (this.children.includes(cells[t])) {

                        } else if (this.parents.includes(cells[t])) {

                        }else if (cells[t].parents.includes(this)) {

                        }else if (cells[t].children.includes(this)) {

                        } else {
                        if (cells[t].body.doesPerimeterTouch(this.body)) {
                            if(cells[t].marked != 1){
                                if (this.body.radius > cells[t].body.radius) {
                                    cells[t].marked = 1
                                    this.repmark = 1
                                    this.age-=400
                                } else  if (this.body.radius < cells[t].body.radius) {
                                    this.marked = 1
                                    cells[t].repmark = 1
                                    cells[t].age -= 400
                                }
                            }
                        }
                    }
                }
            }

            for (let t = 0; t < foods.length; t++) {
                if (foods[t].doesPerimeterTouch(this.body)) {
                    this.repmark = 1
                    foods[t].marked = 1
                    this.age-=300
                    }
            }

            for (let t = 0; t < foods.length; t++) {
                if (foods[t].marked == 1) {
                    foods[t].marked = 0
                    foods[t].x = Math.random()*canvas.width
                    foods[t].y = Math.random()*canvas.height
                }
            }
        }
        reproduce() {
            this.repmark = 0
            let offspring = new Cell(this.body.x, this.body.y, this.r + ((Math.random() - .5) * 36), this.g + ((Math.random() - .5) * 36), this.b + ((Math.random() - .5) * 36))
            offspring.gen = this.gen + 1
            offspring.net = this.net.clone(this.net)
            offspring.net.mutate()
            offspring.parents = [...this.children]
            for(let t = 0;t<this.children.length;t++){
                this.children[t].children.push(offspring)
                this.children[t].parents.push(offspring)
            }
            for(let t = 0;t<this.parents.length;t++){
                this.parents[t].children.push(offspring)
                this.parents[t].parents.push(offspring)
            }
            offspring.parents.push(this)
            this.children.push(offspring)
            offspring.body.radius = this.body.radius+((Math.random()-.55)*.05)
            if(offspring.body.radius > 10){
                offspring.body.radius = 9.5
            }
            if(cells.length < 50){
                cells.push(offspring)
            }
        }
        clean() {
            if (this.marked == 1) {
                cells.splice(cells.indexOf(this), 1)
            }
        }
        cycle() {
            if (this.repmark == 1) {
                this.reproduce()
                this.repmark = 0
            }
        }
    }

    let tmax = 0

    let cells = []
    for (let t = 0; t < 25; t++) {
        cells.push(new Cell(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 255, Math.random() * 255, Math.random() * 255))
    }
    let foods = []
    for (let t = 0; t < 3; t++) {
        foods.push(new Circle(Math.random() * canvas.width, Math.random() * canvas.height, 2, "cyan"))
    }

    function main() {

        while(cells.length < 25){
            cells.push(new Cell(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 255, Math.random() * 255, Math.random() * 255))
        }
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        goals = [TIP_engine.x / 700, TIP_engine.y / 700]
        // // game code goes here

        // let inputs = []
        // for(let t = 0;t<10;t++){
        //     inputs.push(TIP_engine.x)
        //     inputs.push(TIP_engine.y)
        for (let t = 0; t < foods.length; t++) {
            foods[t].draw()
        }
        // }
        for (let t = 0; t < cells.length; t++) {
            cells[t].cycle()
        }
        for (let t = 0; t < cells.length; t++) {
            cells[t].hunt()
        }
        for (let t = 0; t < cells.length; t++) {
            cells[t].clean()
        }
        // for (let t = 0; t < cells.length; t++) {
        //     cells[t].faceLie()
        //     cells[t].bodyLie()
        //     // cells[t].mindLie()
        // }

        let max = 0

        for (let t = 0; t < cells.length; t++) {
            cells[t].gatherInfo()
            cells[t].compute()
            // let ring = new Circle(percs[t].outputs[0]*700, percs[t].outputs[1]*700, 10, percs[t].color)
            cells[t].draw()
            if(cells[t].totalage > max){
                max =cells[t].totalage

        if(tmax < max){
            tmax =max
            console.log(tmax, cells[t].age, cells[t].gen)
        }
            }
        }

        if(keysPressed[' ']){
            console.log(cells)
        }
    }
})
