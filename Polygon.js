/*頂点を表すクラス*/
class Vart{
    constructor(pos,texpos,normal){
        this.pos=pos;
        this.normal=normal;
        this.texpos=texpos;
    }
}
/*ポリゴンを表すクラス
今回は三角と四角を対象に実装*/
class Poly{
    constructor(mat){
        this.verts=new Array();
        this.mat=mat;
    }
    getShadingData(hit){//シェーディング用ノーマルとテクスチャ座標を出力
        let normal=new Vector3(0,0,0);
        let texpos=new Vector3(0,0,0);
        let alldist=0;
        let dists=new Array();
        for(let i=0;i<this.verts.length;i++){
            let dist=this.verts[i].pos.sub(hit.pos).dist();
            dists.push(dist);
            alldist+=dist;
        }
        for(let i=0;i<dists.length;i++){
            let rate=(alldist/(dists.length-1)-dists[i]);
            if(rate<0){continue;}
            normal=normal.add(this.verts[i].normal.mult(rate));
            texpos=texpos.add(this.verts[i].texpos.mult(rate));
        }
        hit.shadingnor=normal.normalized();
        hit.texpos=texpos.normalized();
    }
    Intersect(ray){//レイと該当ポリとの交差判定
        if(this.verts.length<3){//三角形以下
            return null;//交差なし
        }else{ 
            let hit;
            for(let i=0;i<this.verts.length-2;i++){
                hit=this.TrigonIntersect(ray,this.verts[0],this.verts[i+1],this.verts[i+2]);
                if(hit!=null){
                    return hit;
                }
            }
        }
    }
    TrigonIntersect(ray,v1,v2,v3){//△ポリゴンとの当たり判定
		let normal = v2.pos.sub(v1.pos).cross(v3.pos.sub(v2.pos)).normalized();//ノーマルの導出(n=(v2-v1).cross(v3-v2)
        let dirN= (ray.dir).dot(normal);//0徐算対策にray.dir・nを先に導出
        /*ココが正だと面が裏を向いている．
        ０の場合もレイに対しポリゴンが直交しており，次の式で0除算になり交点を導出できない(infになる)ためnullを返す
        */
        if (dirN >= 0) {
			return null;
		}
        let distance = ( v1.pos.dot(normal)-(ray.pos.dot(normal))) / dirN;//直交していないなら計算実行
        if(distance < 0){//距離マイナスはどう加味しても交差しないのでここで撤収
            return null;
        }
        let position = ray.pos.add(ray.dir.mult(distance));//distanceが求まるとpositionもかくのごとく求まる
        /*ここからポリゴン内にあるかどうかの確認(ついでに頂点va,vb,vp間の面積も求める)*/
        let S1=this.InternalCheck(v1,v2,position,normal);
        if(S1==null)return null;
        let S2=this.InternalCheck(v2,v3,position,normal);
        if(S2==null)return null;
        let S3=this.InternalCheck(v3,v1,position,normal);
        if(S3==null)return null;

        //面積比によりレイ単位で法線を求める(phongシェーディング)
        let S=S1+S2+S3;
        let shadingnormal=(v1.normal.mult(S2/S)).add(v2.normal.mult(S3/S)).add(v3.normal.mult(S1/S)).normalized();

        return new Hitinfo(position,normal,distance,ray,this,shadingnormal);
    }
    InternalCheck(va,vb,pos,n){//ポリゴン内かの判定を行う式
        let sv=va.pos.sub(pos);
        let vv=vb.pos.sub(va.pos);
        let m=sv.cross(vv);
        let dp=m.dot(n);
        if(dp<=0)return null;
        return sv.VtoS(vv);
    }
}