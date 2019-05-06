class Vector3{
    constructor(x,y,z){
        this.x=x;
        this.y=y;
        this.z=z;
    } 
    dot(vec){//内積
        return this.x*vec.x+this.y*vec.y+this.z*vec.z;
    }
    cross(vec){//外積
        let x=this.y*vec.z-this.z*vec.y;
        let y=this.z*vec.x-this.x*vec.z;
        let z=this.x*vec.y-this.y*vec.x;
        return new Vector3(x,y,z);
    }
    add(vec){//足し算
        let x=this.x+vec.x;
        let y=this.y+vec.y;
        let z=this.z+vec.z;
        return new Vector3(x,y,z);
    }
    sub(vec){//引き算
        let x=this.x-vec.x;
        let y=this.y-vec.y;
        let z=this.z-vec.z;
        return new Vector3(x,y,z);
    }
    div(c){//割り算
        let x=this.x/c;
        let y=this.y/c;
        let z=this.z/c;
        return new Vector3(x,y,z);
    }
    mult(c){//掛け算
        let x=this.x*c;
        let y=this.y*c;
        let z=this.z*c;
        return new Vector3(x,y,z);
    }
    multvec(vec){
        let x=this.x*vec.x;
        let y=this.y*vec.y;
        let z=this.z*vec.z;
        return new Vector3(x,y,z);
    }
    normalized(){//正規化
        let dist=this.dist();
        return this.div(dist);
    }
    dist(){//距離の導出
        return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2)+Math.pow(this.z,2));
    }
    toarray(){//配列にして出力
        return [this.x,this.y,this.z];
    }
    coordinate_transformation(H){//座標変換(H=[[rx,ry,rz],[sx,sy,sz],[tx,ty,tz]]の配列から)
        let A=this.toarray();
        let R=[0,0,0];
        for(let i=0;i<3;i++){
            for(let j=0;j<3;j++){
                R[i]+=A[j]*H[i][j];
            }
        }
        return new Vector3(R[0],R[1],R[2]);
    }
    tostring(){
        return "("+this.x+","+this.y+","+this.z+")";
    }
    parseIntVec(){//整数ベクトルへの変換
        let x=Math.ceil(this.x);
        let y=Math.ceil(this.y);
        let z=Math.ceil(this.z);
        return new Vector3(x,y,z);
    }
    clamp(min,max){//各値をminからmaxの領域内に収める
        let R=this.toarray();
        for(let i=0;i<3;i++){
            if(R[i]>max)R[i]=max;
            if(R[i]<min)R[i]=min;
        }
        return new Vector3(R[0],R[1],R[2]);
    }
    VtoC(){//ベクトルで表された色をhtmlのカラーコード表現に変換
        let result="#";
        let rgb=this.mult(255).parseIntVec().toarray();
        for(let i=0;i<3;i++){
            let str=( "0" + rgb[i].toString(16) ).slice( -2 )
            result+=str;
        }
        return result;
    }
    static CtoV(code){//htmlのカラーコードをベクトルで表された色に変換
        let r   = parseInt(code.substring(1,3), 16);
        let g = parseInt(code.substring(3,5), 16);
        let b  = parseInt(code.substring(5,7), 16);
        return new Vector3(r/255,g/255,b/255);
    }
    VtoS(vec){//ベクトル同士の計算で三角形の面積を求める
        return Math.sqrt(Math.pow(this.y*vec.z-this.z*vec.y,2)+Math.pow(this.z*vec.x-this.x*vec.z,2)+Math.pow(this.x*vec.y-this.y*vec.x,2))/2;
    }
}