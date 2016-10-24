var c = document.getElementById("main");
var ctx = c.getContext("2d");
var txtTop = document.getElementById("txtTop");
var spd1 = document.getElementById("spd1");
var g = document.getElementById("g");

var Objects = [];
var start = false;
function Simulation()
{
    Objects[0] = new Object("circle");
    txtTop.value = 0;
}

function Animate() {

}
window.setInterval("Animate();", 15);//23
var paused = false;
var gravity = 0;
var count = 0;
var sum = 1;
var moveDown = 1;
function Animate(zooming) {
    if (paused) {
        ctx.fillStyle = "aqua";//black
        ctx.fillRect(-10000, -10000, 20000, 20000);
    }
    if (true) {
        ctx.fillStyle = "aqua";//black
        ctx.fillRect(-10000, -10000, 20000, 20000);

        for (var i = 0; i < Objects.length; i++) {
            Objects[i].Move();
            Objects[i].Draw();
        }
    }

    
    if (!paused) {
        count += sum;        
        if (count % 20 == 0 /*&& Objects.length < 100*/)
            Objects[Objects.length] = new Object("wall");

        if (Objects.length > 100)
        {
            var obj = Objects[0];
            Objects = [];
            Objects[0] = obj;
        }
    }
}

function Pause()
{
    paused = !paused;
}

function Actor()
{

}
var intTop = 0;
function Object(t)
{
    this.ctx = ctx;
    this.type = t;
    this.width = /*c.width - 20; */50 + (Math.random() * 50);
    this.x = (Math.random() * c.width)-this.width;
    this.y = (t == "circle" ? Math.random() * c.height + 0 : 600);
    this.speed = .2 + (Math.random()*5);
    this.height = 20;
    this.color = "black";
    this.radius = 10;
    this.ID = Objects.length;

    this.Move = function Move() {

        if (paused)
            return;

        var size = 0;
        if (this.type == "circle")
            size = this.radius;
        else
            size = this.width;

        if (this.x > (c.width - size)) {
            this.x = (c.width - size);
            this.speed *= -1;
        }

        if (this.x < (this.type == "circle" ? size : 0)) {
            this.x = (this.type == "circle" ? size : 0);
            this.speed *= -1;
        }

        this.x += this.speed;

        if (this.type == "circle") {

            this.y += gravity;            
            //Collisions
            // Collision y
            if (CheckBounceFloor(this)) {
                /*if (gravity < 5)
                    gravity = 5;*/
                gravity *= -1;
                gravity = (gravity * .90);
            }
            //Collision x
            if (CheckBounceSides(this))
            {
                this.speed *= -1;
            }
            if (this.y > c.height - this.radius)
                this.y = c.height - this.radius;

            gravity += 0.1;

            if (intTop > txtTop.value)
                txtTop.value = intTop;

            spd1.value = gravity;

            if ((600 - this.y) > intTop)
                intTop = (600 - this.y);

            if (((this.y + (this.radius * 4)) + (intTop / 2)) > c.height  /*- (this.radius*4)*/)
                intTop -= ((this.y + (this.radius * 4)) + (intTop / 2)) - c.height;

            if (this.speed > 0) {
                if (this.speed - (this.speed * .002) < 0)
                    this.speed = 0;
                else
                    this.speed -= this.speed * .002;
            }
            else
            {
                if (this.speed - (this.speed * .002) > 0)
                    this.speed = 0;
                else
                    this.speed -= this.speed * .002;
            }
                
        }
        else
            this.y -= moveDown;

        
    };
    this.Draw = function Draw()
    {
        
        ctx.beginPath();

        if (this.type == "circle") {
            ctx.arc(this.x, (this.y /*- moveDown*/), this.radius, 0, 2 * Math.PI); //1
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        else {
            ctx.fillStyle = "black";
            ctx.rect(this.x, (this.y /*- moveDown*/), this.width, this.height); //1
            ctx.fill();
            ctx.font = "10px Arial";
            ctx.fillStyle = "white";
            ctx.fillText(this.ID, this.x, this.y + 10);
        }



        ctx.closePath();
    };
}

function CheckBounceFloor(sphere)
{


    g.value = gravity;

    for (var i = 0, obj; obj = Objects[i]; i++) {
        if(obj.type != "circle")
        {
            if (((sphere.y - sphere.radius) < obj.y && ((sphere.y + sphere.radius) + gravity) > obj.y) &&
                ((sphere.x /*- sphere.radius*/) >= obj.x && (sphere.x /*+ sphere.radius*/) <= (obj.x + obj.width)) && (gravity > 0 || gravity < 0 && gravity > - 0.9  ))
            {
                sphere.y = obj.y - sphere.radius;
                gravity += moveDown;
                return true;
            }
        }
    }

    if (sphere.y > (c.height - sphere.radius))
        return true;

    return false;
}

function CheckBounceSides(sphere) {
    for (var i = 0, obj; obj = Objects[i]; i++) {
        if (obj.type != "circle") {
            if ((((sphere.x - sphere.radius) < (obj.x)           && ((sphere.x + sphere.radius) + sphere.speed) >= obj.x) ||
                 ((sphere.x + sphere.radius) > obj.x + obj.width && ((sphere.x - sphere.radius) + sphere.speed) <= obj.x + obj.width)) &&
                ((sphere.y /*- sphere.radius*/) >= obj.y && (sphere.y /*+ sphere.radius*/) <= (obj.y + obj.height))) {
                if (((sphere.x - sphere.radius) < (obj.x) && ((sphere.x + sphere.radius) + sphere.speed) >= obj.x))
                    sphere.x = obj.x - sphere.radius;
                else
                    sphere.x = obj.x + obj.width + sphere.radius;
                
                sphere.speed -= obj.speed;
                return true;
            }
        }
    }

    return false;
}
