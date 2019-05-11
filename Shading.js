/*材質を表すクラス
メタリックワークフローで実装(mtlファイルを読み込む際は適当にコンバートする)*/
class Mat{//材質
    constructor(name){
        this.name=name;
        this.UI=document.createElement("div");
        let Mt = this;//マテリアルの参照位置を入れる（自分）
        this.UI.addEventListener("change", function(evt,mat=Mt){
            mat.setMaterial();//参照マテリアルからsetMaterialの呼び出し
            mat.updateUI();
            console.log("マテリアルを更新");
            Rerenderflag=true;//再レンダリングを要求する
        },false);
        this.albedo=new Vector3(1,1,1);//拡散反射（アルベド）
        this.metalic=0;//メタリック
        this.smoothness=1;//スムーズネス
        this.transparency=0;//透明度
        this.ambient=new Vector3(0.5,0,0.5);//アンビエント
        this.emmitt=new Vector3(0,0,0);
        //以下シェーディング高速化のための
        this.diffuseColor=new Vector3(1,1,1);//メタリックに合わせた拡散反射の成分(updateUI()時に更新)
        this.SpecularColor=new Vector3(0,0,0);//メタリックに合わせた鏡面反射の成分(updateUI()時に更新)
        /*1-smoothness(√α)の2乗と4乗はシェーディングの上で頻出するので先に計算しておく*/
        this.a=Math.pow(1-this.smoothness,2);
        this.aa=Math.pow(1-this.smoothness,4);
        this.updateUI();
    }
    //様々なマテリアルに対応するためマテリアルクラス内にシェーディング関数を実装(邪道？)
    Shading(lightinfos,hit){
        let shadingcolor=this.emmitt;
        if(lightinfos.length==0)return shadingcolor;
        for(let i=0;i<lightinfos.length;i++){
            /*下ごしらえ（シェーディングに必要なベクトルを定義）*/
            let l=lightinfos[i].vec;//ライトベクトルL
            let v=hit.ray.dir.mult(-1);//視点ベクトルV（ray.dirだと視点から点に向かうベクトルなので-1で掛ける）
            let h = v.add(l).normalized();//ハーフベクトルH

            /*内積の下ごしらえ（頻出するので計算を先にやって格納）*/
            let nh=hit.snor.dot(h);
            let ln=l.dot(hit.snor);
            let vn=v.dot(hit.snor);
            let lh=l.dot(h);
            let vh=l.dot(h);
            
            /*Burley diffuse modelを用いてアルベド反射成分を計算する*/
            let f90 = 0.5 + 2.0 * this.a * Math.pow(lh,2);
            let light = 1.0 + (f90 - 1.0) * Math.pow(1.0 - ln,5);//Light拡散項の導出(Schlick近似)
            let view  = 1.0 + (f90 - 1.0) * Math.pow(1.0 - vn,5);//View拡散項の導出(Schlick近似)
            let fd = this.diffuseColor.mult(light * view  / Math.PI); //アルベド反射成分の導出

            /*Torrance-Sparrow modelを用いてスペキュラ反射成分を計算する*/
            let D=this.aa/(Math.PI*Math.pow(1.0-(1.0-this.aa)*Math.pow(nh,2),2));//Ｄ項の導出
            let Ll=(-1+Math.sqrt(1.0+this.aa*(1.0/Math.pow(ln,2)-1.0)));//λlの導出
            let Lv=(-1+Math.sqrt(1.0+this.aa*(1.0/Math.pow(vn,2)-1.0)));//λvの導出
            let G=1.0/(1.0+Ll+Lv);//G項の導出（Smith Joint Masking-Shadowing Functionに則っています）

            let F=this.SpecularColor.add(new Vector3(1.0,1.0,1.0).sub(this.SpecularColor).mult(Math.pow(1.0-Math.abs(vh),5)));//F項の導出(Schlick近似)(Vector3)
            let fs=F.mult((D*G)/(4*Math.abs(ln*vn)));//スペキュラ反射成分の導出(Vector3)
            let color=fd.add(fs);//反射成分はfsとfdの足し算
            color=color.mult(ln).multvec(lightinfos[i].color);//それに光源を加味する
            shadingcolor=shadingcolor.add(color);
        }
        return shadingcolor;
    }
    ReflectShading(color){
        return this.SpecularColor.multvec(color).mult(this.smoothness);
    }
    normalshading(hit){//法線情報を取得
        return  new Vector3(1,1,1).add(hit.snor).div(2);//this.albedo.mult(hit.nor.y+hit.nor.z).add(this.emmitt).add(this.ambient);
    }
    updateUI(){
        this.UI.innerHTML ='<b>'+this.name+'</b><br>';
        this.UI.innerHTML += 'Arbedo<input name="Arbedo" type="color" value="'+this.albedo.VtoC()+'">';
        this.UI.innerHTML +="<br>";
        this.UI.innerHTML += 'Metalic<input name="Metaric" type="range" name="num" min="0" max="1.0" step="0.1" value="'+this.metalic+'">';
        this.UI.innerHTML +="<br>";
        this.UI.innerHTML += 'Smoothness<input name="Smoothness" type="range" name="num" min="0" max="1.0" step="0.1" value="'+this.smoothness+'">';
        this.UI.innerHTML +="<br>";
        //this.UI.innerHTML += 'Ambient<input name="Ambient" type="color" value="'+this.ambient.VtoC()+'">';
        this.UI.innerHTML += 'Emitt<input name="Emitt" type="color" value="'+this.emmitt.VtoC()+'">';
        this.UI.innerHTML +="<br>";
        this.diffuseColor=this.albedo.mult(1.0-this.metalic);//メタリックに合わせた拡散反射の成分の更新
        this.SpecularColor=this.albedo.mult(0.04 * (1.0 - this.metalic)+this.metalic).add(new Vector3(0.1,0.1,0.1));//メタリックに合わせた鏡面反射の成分の更新
        /*1-smoothness(√α)の2乗と4乗はシェーディングの上で頻出するので先に計算しておく*/
        this.a=Math.pow(1.0-this.smoothness,2);
        this.aa=Math.pow(1.0-this.smoothness,4);
    }
    /*UIの情報を受けてマテリアルの更新を行う */
    setMaterial(){
        var from_child =  this.UI.children;// UIの子要素を取得
        for (var i = 0; i < from_child.length; i++){//子要素の値を取得
            switch(from_child[i].name){//名前を元に各要素に割り当てていく
                case "Arbedo":
                    this.albedo=Vector3.CtoV(from_child[i].value);
                break;
                case "Metaric"://メタリック
                    this.metalic=parseFloat(from_child[i].value);
                break;
                case "Smoothness"://スムーズネス
                    this.smoothness=parseFloat(from_child[i].value);
                break;
                case "Ambient"://アンビエント
                    this.ambient=Vector3.CtoV(from_child[i].value);
                break;
                case "Emitt"://エミット
                    this.emmitt=Vector3.CtoV(from_child[i].value);
                break;
            }
        }
    }
}
