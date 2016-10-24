var c = document.getElementById("main");
var ctx = c.getContext("2d");
var txtTop = document.getElementById("txtTop");
var spd1 = document.getElementById("spd1");
var g = document.getElementById("g");
var posX = document.getElementById("posX");
var posY = document.getElementById("posY");

var Objects = [];
var start = false;
var worldWidth = 0;
var worldHeight = 0;
function Simulation()
{
    Objects[0] = new Object("circle");
    txtTop.value = 0;
    var rows = template.split('\n');
    for (var i = 0, row; row = rows[i]; i++) {        
        for (var k = 0, col; col = row[k]; k++) {
            if (col == "X") {
                var wall = new Object("wall");
                wall.x = wall.width * k;
                wall.y = wall.height * i;
                Objects[Objects.length] = wall;
            }
        }
    }

    worldWidth = rows[0].length * new Object("wall").width;
    posX.value = worldWidth;

    worldHeight = rows.length * new Object("wall").height;
    posY.value = worldHeight;
}

var paused = false;
var gravity = 0;
var count = 0;
var sum = 1;
var moveDown = 0;
var scroller = 0;
var TimeSpan;
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
        if (count > 10000)
            count = 0;
        count++;;

    }

    var d = new Date();
    if (count % 15 == 0)
        fps.value = Math.round(1000 / ((TimeSpan - d.getTime()) * -1));
    TimeSpan = d.getTime();
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
    this.width = 20/*c.width - 20; 50 + (Math.random() * 50)*/;
    this.x = t == "circle" ? 50 : 0;//(Math.random() * c.width)-this.width;
    this.y = t == "circle" ? 50 : 0;//Math.random() * c.height;
    this.speed = t=="circle"?2 + (Math.random()*5):0;
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

        if (this.type == "platform" || this.type == "circle") {
            if (this.x > (c.width + scroller - size)) {
                this.x = (c.width + scroller - size);
                this.speed *= -1;
            }
        }

        if (this.x < (this.type == "circle" ? size : 0)) {
            this.x = (this.type == "circle" ? size : 0);
            this.speed *= -1;
        }

        

        if (this.type == "circle") {

            this.y += gravity;            
            //Collisions
            // Collision y
            if (CheckBounceFloor(this)) {
                /*if (gravity < 5)
                    gravity = 5;*/
                gravity *= -1;
                gravity = (gravity * .9);
            }
            //Collision x
            if (CheckBounceSides(this))
            {
                this.speed *= -1;
                this.speed = this.speed * .9;
            }
            if (this.y > c.height - this.radius + moveDown)
                this.y = c.height - this.radius + moveDown;

            gravity += 0.1;

            if (intTop > txtTop.value)
                txtTop.value = intTop;

            spd1.value = gravity;

            if ((600 - this.y) > intTop)
                intTop = (600 - this.y);

            if (((this.y + (this.radius * 4)) + (intTop / 2)) > c.height  /*- (this.radius*4)*/)
                intTop -= ((this.y + (this.radius * 4)) + (intTop / 2)) - c.height;

            this.x += this.speed;

            //Scroll left-right
            if (this.x > (c.width / 2)) {
                if (this.x < (worldWidth) - this.radius) {
                    scroller = this.x - (c.width / 2);

                    if (scroller > (worldWidth / 2) + ((worldWidth-(c.width*2))/2))
                        scroller = (worldWidth / 2) + ((worldWidth - (c.width * 2)) / 2);
                }
                else
                    scroller = (worldWidth / 2) - this.radius;
            }
            else
                scroller = 0;

            //Scroll up-down
            if ((this.y + moveDown > (c.height / 3)*2 && gravity > 0) ||
                (this.y - moveDown < (c.height / 3)  && gravity < 0)) {
                if (this.y < (worldHeight) - this.radius) {

                    if (gravity > 0 && this.y - moveDown > (c.height / 3) * 2)
                        moveDown = this.y - ((c.height / 3) * 2);
                    else
                        moveDown = this.y - ((c.height / 3));

                    if (moveDown > (worldHeight / 2) + ((worldHeight - (c.height * 2)) / 2))
                        moveDown = (worldHeight / 2) + ((worldHeight - (c.height * 2)) / 2);

                    if (moveDown < 0)
                        moveDown = 0;
                }
                else
                    moveDown = (worldHeight / 2) - this.radius;
            }
            /*else
                moveDown = 0;*/


        }
        /*else
            this.y -= moveDown;*/
        g.value = scroller;
        
    };
    this.Draw = function Draw()
    {
        
        ctx.beginPath();

        if (this.type == "circle") {
            ctx.arc(this.x - scroller, (this.y - moveDown), this.radius, 0, 2 * Math.PI); //1
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        else {
            ctx.fillStyle = "black";
            ctx.rect(this.x - scroller, (this.y - moveDown), this.width, this.height); //1
            ctx.fill();
            ctx.font = "8px Arial";
            ctx.fillStyle = "white";
            ctx.fillText(this.ID, this.x - scroller, this.y + 10 - moveDown);
        }



        ctx.closePath();
    };
}

function CheckBounceFloor(sphere)
{
    for (var i = 0, obj; obj = Objects[i]; i++) {
        if(obj.type != "circle")
        {
            if (((sphere.y - sphere.radius) < obj.y && ((sphere.y + sphere.radius) + gravity) > obj.y) &&
                ((sphere.x /*- sphere.radius*/) >= obj.x && (sphere.x /*+ sphere.radius*/) <= (obj.x + obj.width)) && (gravity > 0 || gravity < 0 && gravity > - 0.9  ))
            {
                sphere.y = obj.y - sphere.radius;
                /*gravity += moveDown;*/
                return true;
            }
        }
    }

    if (sphere.y > (c.height - sphere.radius + moveDown))
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
