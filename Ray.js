/*レイを表すクラス
今回は三角と四角を対象に実装*/
class Ray{
    constructor(pos,dir){
        this.pos=pos;
        this.dir=dir;
    }
}
/*レイの当たり情報 */
class Hitinfo{
    constructor(pos,normal,dist,ray,poly,shadingnormal=normal,texpos=new Vector3(0,0,0)){
        this.snor=shadingnormal;//形状とは違うシェーディング用の法線
        this.texpos=texpos;//テクスチャ座標(使うのはx,yだけ)
        this.pos=pos;//衝突位置
        this.nor=normal;//衝突地点の法線
        this.dist=dist;//発射地点からの距離
        this.ray=ray;//レイの情報
        this.poly=poly;//衝突ポリゴン
    }
}