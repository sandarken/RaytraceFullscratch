/*レイトレ結果をレンダリングするためのバッファ（canvasに直接描画だと速度低下を招くため，イメージデータ上でレンダリングし，描画する）*/
class SceneBuffer{
    constructor(Width,Height,ctx) {
        this.w = Width;
        this.h = Height;
        this.imageData=ctx.createImageData(Width,Height);
        this.imageData=ctx.createImageData(Width,Height);
        let buffersize=this.w*this.h;
        this.color=new Array(buffersize);
        for(let i=0;i<buffersize;i++){
            this.color[i]=new Vector3(0,0,0);
        }
        for(var x=0; x<this.w;x++){
            for(var y=0;y<this.h;y++){
                this.setpixel(x,y,0,0,0,255);
            }
        }
    }
    /*ピクセルに色を設定する*/
    setpixel(bufferpos,color){
        this.color[bufferpos]=color;
    }
    /*bufferposを起点にしたh,wの領域に色を設定する*/
    setRect(bufferpos,w,h,color){
        let sx=bufferpos%this.w;//bufferposから視点のx座標を求める
        let sy=Math.ceil((bufferpos-sx)/this.w);//bufferposから視点のy座標を求める(念のため整数化)
        for(let i=0;i<h && sy+i<this.h;i++){
            for(let j=0;j<w && sx+j<this.w;j++){
                this.color[bufferpos+this.getbufferpos(j,i)]=color;
            }    
        }
    }
    /*ピクセルに色を加算する*/
    addcolor(bufferpos,color){
        this.color[bufferpos].add(color);
    }
    /*画像のxy座標からbufferposを求める */
    getbufferpos(x,y){
        return y*this.w+x;
    }
    /*バッファーに画素情報を格納する */
    setbuffer(x,y,r,g,b,a){
        let pos=(y*this.w+x)*4;
        this.imageData.data[pos]=r;
        this.imageData.data[pos+1]=g;
        this.imageData.data[pos+2]=b;
        this.imageData.data[pos+3]=a;
    }

    clear(){
        this.imageData=ctx.createImageData(this.w,this.h);
        let buffersize=this.w*this.h;
        for(let i=0;i<buffersize;i++){
            this.color[i]=new Vector3(0.0,0.0,0.0);
        }
    }

    ColorCovert(scale){
        if(scale<=0)scale=1;//無限ループ落ち対策
        let posx=0,posy=0;//描画用イメージデータの格納先画素を示す変数
        for(let x=0; x<this.w;x+=scale){
            posx++;
            for(let y=0;y<this.h;y+=scale){
                posy++;
                let bufferpos=y*this.w+x;//サンプリング先の画素を取得
                let col=this.color[bufferpos].clamp(0,1).mult(255).parseIntVec();//ベクトルで表現された色を8bitカラーに丸める
                this.setbuffer(posx,posy,col.x,col.y,col.z,255);
            }
            posy=0;
        }
    }
    /*x,y:描画位置 
    scale:描画画像のサンプリング間隔(例:２の場合は2ピクセル毎にサンプリングするので画像サイズが２分の１になって表示される)*/
    draw(x,y,scale,ctx){
        this.ColorCovert(scale);
        if(scale!=1){
            ctx.putImageData(this.imageData,x,y,0,0,Math.ceil(this.w/scale),Math.ceil(this.h/scale));
        }else{
            ctx.putImageData(this.imageData,x,y);
        }
    }
}