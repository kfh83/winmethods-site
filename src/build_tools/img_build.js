const gulp        = require("gulp");
const canvas      = require("canvas");
const through2    = require("through2");
const glob        = require("glob");
const vinyl       = require("vinyl");
const path        = require("path");
const process     = require("process");
const fs          = require("fs");
const mergeStream = require("merge-stream");
const vfl         = require("./vfl");

class GrowingPacker
{
    root = null;

    fit(blocks)
    {
        let len = blocks.length;
        let w = (len > 0) ? blocks[0].w : 0;
        let h = (len > 0) ? blocks[0].h : 0;
        this.root = { x: 0, y: 0, w, h };
        for (let n = 0; n < len; n++)
        {
            let block = blocks[n];
            let node = this.findNode(this.root, block.w, block.h);
            if (node)
                block.fit = this.splitNode(node, block.w, block.h);
            else
                block.fit = this.growNode(block.w, block.h);
        }
    }

    findNode(root, w, h)
    {
        if (root.used)
            return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
        else if ((w <= root.w) && (h <= root.h))
            return root;
        else
            return null;
    }

    splitNode(node, w, h)
    {
        node.used = true;
        node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
        node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
        return node;
    }

    growNode(w, h)
    {
        let canGrowDown  = (w <= this.root.w);
        let canGrowRight = (h <= this.root.h);

        let shouldGrowRight = canGrowRight && (this.root.h >= (this.root.w + w));
        let shouldGrowDown  = canGrowDown  && (this.root.w >= (this.root.h + h));

        if (shouldGrowRight)
            return this.growRight(w, h);
        else if (shouldGrowDown)
            return this.growDown(w, h);
        else if (canGrowRight)
            return this.growRight(w, h);
        else if (canGrowDown)
            return this.growDown(w, h);
        else
            return null;
    }

    growRight(w, h) {
        this.root = {
            used: true,
            x: 0,
            y: 0,
            w: this.root.w + w,
            h: this.root.h,
            down: this.root,
            right: { x: this.root.w, y: 0, w: w, h: this.root.h }
        };
        let node = this.findNode(this.root, w, h)
        if (node)
            return this.splitNode(node, w, h);
        else
            return null;
    }
    
    growDown(w, h) {
        this.root = {
            used: true,
            x: 0,
            y: 0,
            w: this.root.w,
            h: this.root.h + h,
            down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
            right: this.root
        };
        let node = this.findNode(this.root, w, h);
        if (node)
            return this.splitNode(node, w, h);
        else
            return null;
    }
}

let g_imageMap = {};
let g_sheetMap = {};

function writeImageSheetMap(cb)
{
    const MAP_FILE_PATH = "../css/_imgmap.scss";

    let fileContents = "$_images: (";
    for (const name in g_imageMap)
    {
        fileContents += "\n";
        fileContents += `    "${name}": "${g_imageMap[name]}",`;
    }
    fileContents += "\n);\n\n";

    fileContents += "$_sheets: (";
    for (const name in g_sheetMap)
    {
        fileContents += "\n";
        fileContents += `   "${name}": (`;
        fileContents += "\n";
        fileContents += `        "_sheet": "${g_sheetMap[name]._sheet}",`;
        fileContents += "\n        \"_sprites\": (";
        for (const spriteName in g_sheetMap[name]._sprites)
        {
            let sprite = g_sheetMap[name]._sprites[spriteName];
            fileContents +=`
            "${spriteName}": (
                "x": -${sprite.x}px,
                "y": -${sprite.y}px,
                "w": ${sprite.w}px,
                "h": ${sprite.h}px
            ),`;
        }

        fileContents += "\n        )\n    ),\n);";
    }

    fs.writeFileSync(MAP_FILE_PATH, fileContents);
    cb();
}

function writeToImageMap()
{
    return through2.obj(function(file, encoding, cb)
    {
        let imageName = path.basename(file._originalName, path.extname(file._originalName));
        let imagePath = "/s/imgbin/" + path.basename(file.path);
        g_imageMap[imageName] = imagePath;
        cb(null, file);
    });
}

function writeToSheetMap()
{
    return through2.obj(function(file, encoding, cb)
    {
        let sheetName = path.basename(file._originalName, path.extname(file._originalName));
        let imagePath = "/s/imgbin/" + path.basename(file.path);
        g_sheetMap[sheetName] = { "_sheet": imagePath, "_sprites": file._sprites };
        cb(null, file);
    });
}

function buildSheet()
{
    let sprites = [];
    let sheetName = null;
    
    return through2.obj(function(file, encoding, cb)
    {
        canvas.loadImage(file.path).then(function(image)
        {
            if (!sheetName)
            {
                sheetName = path.basename(path.dirname(file.path));
            }

            let sprite = path.basename(file.path, path.extname(file.path));
            sprites.push({ image, sprite, w: image.width, h: image.height });
            cb();
        }).catch(function(err)
        {
            cb(err);
        });
    }, function(cb)
    {
        // Sort images first
        const SORTERS = {
            w:   function (a,b) { return b.w - a.w; },
            h:   function (a,b) { return b.h - a.h; },
            max: function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
            min: function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },
        };
        
        sprites.sort(function(a, b) {
            for (const method of [ "max", "min", "h", "w" ])
            {
                let diff = SORTERS[method](a, b);
                if (diff != 0)
                    return diff;
            }
            return 0;
        });

        // Apply some padding to each sprite box to make sure other
        // sprites don't bleed into each other
        const PADDING = 1;
        for (const sprite of sprites)
        {
            sprite.w += PADDING * 2;
            sprite.h += PADDING * 2;
        }

        let packer = new GrowingPacker;
        packer.fit(sprites);

        let can = canvas.createCanvas(packer.root.w, packer.root.h);
        let ctx = can.getContext("2d");
        for (const sprite of sprites)
        {
            ctx.drawImage(
                sprite.image,
                sprite.fit.x + PADDING,
                sprite.fit.y + PADDING);
        }

        let stream = can.toBuffer("image/png");
        let file = new vinyl({
            path: `${sheetName}.png`,
            contents: stream
        });
        file._sprites = {};
        for (const sprite of sprites)
        {
            file._sprites[sprite.sprite] = {
                x: sprite.fit.x + PADDING,
                y: sprite.fit.y + PADDING,
                w: sprite.w - PADDING * 2,
                h: sprite.h - PADDING * 2
            };
        }
        this.push(file);
        cb();
    });
}

function buildImages()
{ 
    return gulp.src("../img/*.png", { encoding: false })
        .pipe(vfl.gulp("s/imgbin"))
        .pipe(writeToImageMap())
        .pipe(gulp.dest("../../s/imgbin/"));   
}

function buildSheets()
{
    let sheets = [...new Set(
        glob.sync("../img/*/*.png")
            .map(p => path.basename(path.dirname(p)))
    )];

    return mergeStream(sheets.map(sheet =>
        gulp.src(`../img/${sheet}/*.png`)
            .pipe(buildSheet())
            .pipe(vfl.gulp("s/imgbin"))
            .pipe(writeToSheetMap())
            .pipe(gulp.dest("../../s/imgbin/"))
    ));
}

module.exports = { buildImages, buildSheets, writeImageSheetMap };