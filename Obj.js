/*オブジェクト（ポリゴンの集合体一つ）を表すクラス */
class Obj{
    constructor(name,geom){
        this.name=name;
        this.trisnum=0;//△ポリゴン数(ちまっこく計算していると遅くなるのでobj読み込みの際に計算している)
        this.UI=document.createElement("div");
        this.deleteOrder=false;//自己消去を行うか(消去ボタンで自らを消すために便宜上用意された変数)
        let obj=this;//自分の光源の参照位置を入れる（後述のUIの関数で呼び出す際に使用）
        this.UI.addEventListener("click", function(evt,g=geom,base=obj){
            console.log(base.name+"を消去");
            base.deleteOrder=true;//消去要求を出す
            g.Orderdelete(g.objs);//参照ジオメトリから消去命令を実行する
            g.updateObjUI();
            Rerenderflag=true;//再レンダリングを要求する
        },false);
        this.polys=new Array();
    }
    updateUI(){
        this.UI.innerHTML ='<b>'+this.name+'<input type="button" value="×"></b><br>';
        this.UI.innerHTML +="polygon :▲"+this.trisnum+" ■"+this.polys.length+"<br>";
    }
}