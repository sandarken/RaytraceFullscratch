
/*並行光源*/
class Parallellight{
    constructor(id,vec,pow,color,geom){
        this.color=color;//色
        this.power=pow;//強さ
        this.name="平行光源"+id;
        this.vec=vec;//向き
        this.deleteOrder=false;//自己消去を行うか消去ボタンで自らを消すための処理
        this.UI=document.createElement("div");
        let Lt = this;//自分の光源の参照位置を入れる（後述のUIの関数で呼び出す際に使用）
        this.UI.addEventListener("change", function(evt,base=Lt,g=geom){
            base.setLight(g);//参照マテリアルからsetLightの呼び出し
            console.log("並行光源を更新");
            Rerenderflag=true;//再レンダリングを要求する
            base.updateUI();
        },false);
        this.updateUI();
    }
    updateUI(){
        this.UI.innerHTML = '<b>'+this.name+'</b>';
        this.UI.innerHTML += '<input type="checkbox" name="delete" id="delete'+this.name+'"><br>';
        this.UI.innerHTML += '<label class="label" for="delete'+this.name+'">消去</label><br>';
        this.UI.innerHTML += '色<input name="Color" type="color" value="'+this.color.VtoC()+'">';
        this.UI.innerHTML += '強さ　<input name="Power" type="number" value="'+this.power+'" step="0.01" min="0" max="10"><br>';
        this.UI.innerHTML += '向き';
        this.UI.innerHTML +="<br>";
        this.UI.innerHTML += 'X<input name="Dx" type="number" value="'+this.vec.x+'">';
        this.UI.innerHTML += 'Y<input name="Dy" type="number" value="'+this.vec.y+'">';
        this.UI.innerHTML += 'Z<input name="Dz" type="number" value="'+this.vec.z+'">';
        this.UI.innerHTML +="<br>";
    }
    /*UIの情報を受けてLightの更新を行う */
    setLight(geom){
        var from_child =  this.UI.children;// UIの子要素を取得
        for (var i = 0; i < from_child.length; i++){//子要素の値を取得
            switch(from_child[i].name){//名前を元に各要素に割り当てていく
                case "delete":
                    if(from_child[i].checked){//押されたのが点光源の追加だったら
                        this.deleteOrder=true;//消去要求を出す
                        geom.Orderdelete(geom.Lights);//参照ジオメトリから消去命令を実行する
                        console.log("点光源を消去");
                        Rerenderflag=true;//再レンダリングを要求する
                        geom.updateLightUI();
                        return;//これ以上の処理は不要なので抜ける
                    }
                break;
                case "Power":
                this.power=parseFloat(from_child[i].value);
                break;
                case "Color":
                    this.color=Vector3.CtoV(from_child[i].value);
                break;
                case "Dx":
                    this.vec.x=parseFloat(from_child[i].value);
                break;
                case "Dy":
                    this.vec.y=parseFloat(from_child[i].value);
                break;
                case "Dz":
                    this.vec.z=parseFloat(from_child[i].value);
                break;
            }
        }
    }
    generatelightinfo(ray){
        return new lightinfo(ray.dir,this.color.mult(this.power));
    }
    Intersect(hit,geom){
        let raystart=hit.pos.add(hit.nor.mult(0.00001));//計算誤差で自らのポリゴンとレイが激突するのをふせぐため，微量にレイの開始地点を浮かせる.
        let ray=new Ray(raystart,this.vec.mult(-1).normalized());//ターゲット座標から光源までのレイを作る
        let dirN= (ray.dir).dot(hit.snor);//ray.dir・nを先に導出
        /*ココが負だと面がそもそも光源の方を向いてないので．重たいジオメトリとの交差計算を除外するために早めの撤収
        ０の場合もレイに対しポリゴンが直交しており，次の式で0除算になり交点を導出できない(infになる)ためnullを返す*/
        if (dirN <= 0) {
			return null;
		}
        if(geom==null){return this.generatelightinfo(ray);}//ジオメトリが無かったら交差判定不要なのでlightinfo出して終了
        let rayhit=geom.Intersect(ray);//ジオメトリとの交差判定．かなり処理が重たいので注意！
        if(rayhit==null){
            return this.generatelightinfo(ray);//何にも追突しなかったのでlightinfo出して終了
        }
        return null;//ここまで来ているという事は何かしらのジオメトリに邪魔されて光に届いてないのでnullを返す．
    }
    
}
/*atte:減衰率(float)
color:光の色(vector3)
vec:点光源なら位置,並行光源なら方向を表す(vector3)
pointflag;trueなら点光源(bool)
 */
class Pointlight{
    constructor(id,pos,pow,atte,color,geom){
        this.attenuation=atte;//光の減衰率(x:距離に関係ない減衰率,y:距離に反比例する減衰率,z:距離の２乗に反比例する減衰率)
        this.color=color;//光源色
        this.power=pow;//強さ
        this.type=1;
        this.pos=pos;//位置
        this.name="点光源"+id;
        this.UI=document.createElement("div");
        let Lt = this;//自分の光源の参照位置を入れる（後述のUIの関数で呼び出す際に使用）
        this.deleteOrder=false;//自己消去を行うか消去ボタンで自らを消すための処理
        this.UI.addEventListener("change", function(evt,base=Lt,g=geom){
            base.setLight(g);//参照マテリアルからsetLightの呼び出し
            console.log("点光源を更新");
            Rerenderflag=true;//再レンダリングを要求する
            base.updateUI();
        },false);
        
    }
    updateUI(){
        this.UI.innerHTML = '<b>'+this.name+'</b>';
        this.UI.innerHTML += '<input type="checkbox" name="delete" id="delete'+this.name+'">';
        this.UI.innerHTML += '<label class="label" for="delete'+this.name+'">消去</label><br>';
        this.UI.innerHTML += '色<input name="Color" type="color" value="'+this.color.VtoC()+'"><br>';
        this.UI.innerHTML += '強さ　<input name="Power" type="number" value="'+this.power+'" step="0.01" min="0" max="10"><br>';
        this.UI.innerHTML += '減衰<br>';
        this.UI.innerHTML += 'Kc<input name="kc" type="number" value="'+this.attenuation.x+'" step="0.01" min="0" max="10">';
        this.UI.innerHTML += 'Kl<input name="kl" type="number" value="'+this.attenuation.y+'" step="0.01" min="0" max="10">';
        this.UI.innerHTML += 'Kq<input name="kq" type="number" value="'+this.attenuation.z+'" step="0.01" min="0" max="10">';
        this.UI.innerHTML += "<br>";
        this.UI.innerHTML += '位置<br>';
        this.UI.innerHTML += 'X<input name="Dx" type="number" value="'+this.pos.x+'" step="0.1" min="0" max="10" >';
        this.UI.innerHTML += 'Y<input name="Dy" type="number" value="'+this.pos.y+'" step="0.1" min="0" max="10">';
        this.UI.innerHTML += 'Z<input name="Dz" type="number" value="'+this.pos.z+'" step="0.1" min="0" max="10">';
        this.UI.innerHTML += "<br>";
    }
    /*UIの情報を受けてLightの更新を行う */
    setLight(geom){
        var from_child =  this.UI.children;// UIの子要素を取得
        for (var i = 0; i < from_child.length; i++){//子要素の値を取得
            switch(from_child[i].name){//名前を元に各要素に割り当てていく
                case "delete":
                    if(from_child[i].checked){//押されたのが点光源の追加だったら
                        this.deleteOrder=true;//消去要求を出す
                        geom.Orderdelete(geom.Lights);//参照ジオメトリから消去命令を実行する
                        console.log("点光源を消去");
                        Rerenderflag=true;//再レンダリングを要求する
                        geom.updateLightUI();
                        return;//これ以上の処理は不要なので抜ける
                    }
                break;
                case "Color":
                this.color=Vector3.CtoV(from_child[i].value);
                break;
                case "Power":
                this.power=parseFloat(from_child[i].value);
                break;
                case "kc":
                this.attenuation.x=parseFloat(from_child[i].value);
                break;
                case "kl":
                this.attenuation.y=parseFloat(from_child[i].value);
                break;
                case "kq":
                this.attenuation.z=parseFloat(from_child[i].value);
                break;
                case "Dx":
                this.pos.x=parseFloat(from_child[i].value);
                break;
                case "Dy":
                this.pos.y=parseFloat(from_child[i].value);
                break;
                case "Dz":
                this.pos.z=parseFloat(from_child[i].value);
                break;
            }
        }
    }
    generatelightinfo(ray,dist){
        let divval=(0.0+this.attenuation.x + this.attenuation.y* dist + this.attenuation.z*dist*dist);
        let atte= this.power;
        if(divval>0)atte= this.power /  divval;
        return new lightinfo(ray.dir,this.color.mult(atte));
    }
    Intersect(hit,geom){
        let raystart=hit.pos.add(hit.nor.mult(0.00001));//計算誤差で自らのポリゴンとレイが激突するのをふせぐため，微量にレイの開始地点を浮かせる.
        let rayvec=this.pos.sub(raystart);
        let raydist=rayvec.dist();
        let ray=new Ray(raystart,rayvec.div(raydist));//ターゲット座標から光源までのレイを作る
        let dirN= (ray.dir).dot(hit.snor);//ray.dir・nを先に導出
        /*ココが負だと面がそもそも光源の方を向いてないので．重たいジオメトリとの交差計算を除外するために早めの撤収
        ０の場合もレイに対しポリゴンが直交しており，次の式で0除算になり交点を導出できない(infになる)ためnullを返す*/
        if (dirN <= 0) {
			return null;
		}
        if(geom==null){return this.generatelightinfo(ray,raydist);}//ジオメトリが無かったら交差判定不要なのでlightinfo出して終了
        let rayhit=geom.Intersect(ray);//ジオメトリとの交差判定．かなり処理が重たいので注意！
        if(rayhit==null || rayhit.dist>=raydist){
            return this.generatelightinfo(ray,raydist);//何にも追突しなかったのでlightinfo出して終了
        }
        return null;//ここまで来ているという事は何かしらのジオメトリに邪魔されて光に届いてないのでnullを返す．
    }
}
//照らされているという情報だけを抜き出したもの
class lightinfo{
    constructor(vec,color){
        this.color=color;
        this.vec=vec;
    }
}