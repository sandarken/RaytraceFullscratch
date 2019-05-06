class Geom{
    constructor(){
        this.name="(この表示が出たらエラー)";
        this.RangeMIN=new Vector3(0,0,0);//領域の最小
        this.RangeMAX=new Vector3(0,0,0);//領域の最大
        this.objs=new Array();
        this.objs.push(new Obj("default",this));
        this.Materials=new Array();
        this.Materials.push(new Mat("default"));
        this.Lights=new Array();
        this.IDbuf=0;//生成オブジェクトの識別が必要な場合に用いるID割り当て用変数
        this.Lights.push(new Pointlight(this.setID(),new Vector3(0,3,1),5.0,new Vector3(1,0.1,0.2),new Vector3(1,1,1),this));
        this.addLightUI=document.createElement("addLight");//光源追加用UI
        let geom = this;//自身の参照位置を入れる（後述のUIの関数で呼び出す際に使用）
        this.addLightUI.addEventListener("change", function(evt,base=geom){
                base.addLight();
                base.updateLightUI();//参照マテリアルからsetMaterialの呼び出し
                Rerenderflag=true;//再レンダリングを要求する
            },false);

        this.updateMaterialUI();
        this.updateObjUI();
        this.updateLightUI();

    }
    setID(){//一意のＩＤを生成する
        this.IDbuf++;
        return this.IDbuf;
    }
    /*UI上のマテリアルパネルを更新する*/
    updateMaterialUI(){
        let parent_object = document.getElementById("mat");
        for(let i=1;i<this.Materials.length;i++){
            this.Materials[i].updateUI();
            parent_object.appendChild(this.Materials[i].UI);
        }
    }
    /*UI上のオブジェクトパネルを更新する*/
    updateObjUI(){
        let parent_object = document.getElementById("obj");
        while (parent_object.firstChild) {
            parent_object.removeChild(parent_object.firstChild);
        }
        for(let i=1;i<this.objs.length;i++){
            console.log("addUI("+i+"):"+this.objs[i].name);
            this.objs[i].updateUI();
            parent_object.appendChild(this.objs[i].UI);
        }
    }
    /*UI上の光源パネルを更新する*/
    updateLightUI(){
        let parent_object = document.getElementById("light");
        while (parent_object.firstChild) {
            parent_object.removeChild(parent_object.firstChild);
        }
        for(let i=0;i<this.Lights.length;i++){
            console.log("addUI("+i+"):"+this.Lights[i].name);
            this.Lights[i].updateUI();
            parent_object.appendChild(this.Lights[i].UI);
        }
        /*プログラムの仕様上複数のボタン認識を用いることが出来ないのでチェックボックスを用いる */
        this.addLightUI.innerHTML='<input type="checkbox" name="pointlt" id="pointlt">';
        this.addLightUI.innerHTML+='<input type="checkbox" name="parallellt" id="parallellt">';
        this.addLightUI.innerHTML+='<label class="label" for="pointlt">点光源を追加</label>';
        this.addLightUI.innerHTML+='<label class="label" for="parallellt">平行光源を追加</label>';
        parent_object.appendChild(this.addLightUI);
    }
    /*UIの情報を受けてLightの追加を行う */
    addLight(){
        //this.Lights.push(new Parallellight(new Vector3(1,-1,0).normalized(),new Vector3(1,1,1)));
        var from_child =  this.addLightUI.children;// UIの子要素を取得
        for (var i = 0; i < from_child.length; i++){//子要素の値を取得
            console.log(from_child[i].name+":"+from_child[i].checked);
            switch(from_child[i].name){//名前を元に各要素に割り当てていく
                case "pointlt":
                    if(from_child[i].checked){//押されたのが点光源の追加だったら
                        this.Lights.push(new Pointlight(this.setID(),new Vector3(0,3,1),5,new Vector3(1,0.1,0.2),new Vector3(1,1,1),this));
                        console.log("点光源追加");
                    }
                break;
                case "parallellt":
                    if(from_child[i].checked){//押されたのが平行光源の追加だったら
                        this.Lights.push(new Parallellight(this.setID(),new Vector3(0,-1,0),5,new Vector3(1.0,1.0,1.0),this));
                        console.log("平行光源追加");
                    }
                break;
            }
        }
    }
    refMaterial(name){//マテリアル参照関数.該当する名前の物がなければ新規に作る
        for(let i=0;i<this.Materials.length;i++){
            if(this.Materials[i].name==name){//一致する名前のマテリアルが有れば参照
                return this.Materials[i];
            }
        }
        this.Materials.push(new Mat(name));//無ければ新たに作成し，参照する
        return this.Materials[this.Materials.length-1];
    }
    makeObj(name){//オブジェクト作成関数.該当する名前の物があったら末尾に数字をつけて新規に作る
        let num=0;
        let peculiarflag=false;//固有であるかのフラグ
        while(!peculiarflag){//固有になるまでnumをインクリメントしている
            peculiarflag=true;//先にtrueにしておく(一度でも一致しなければtrueのまま)
            for(let i=0;i<this.objs.length;i++){
                if(num==0){
                    if(this.objs[i].name==name){
                        num++;
                        peculiarflag=false;
                        break;
                    }
                }else if(this.objs[i].name==name+num){//一致していたらnumをインクリメント
                    num++;
                    peculiarflag=false;
                    break;
                }
            }
        }
        if(num==0)this.objs.push(new Obj(name,this));
        else this.objs.push(new Obj(name+num,this));
        return this.objs[this.objs.length-1];
    }
    /*名前が一致したオブジェクトを削除する(name要素があるArrayならなんでも可能) */
    refdelete(arr,name){
        for(let i=0;i<arr.length;i++){
            if(arr[i].name==name){//一致する名前のマテリアルが有れば参照
                arr.splice(i,1);
                return true;
            }
        }
        return false;
    }
    /*deleteOrderがtrueの要素を消去する(bool型のdeleteOrder要素があるArrayならなんでも可能) */
    Orderdelete(arr){
        for(let i=0;i<arr.length;i++){
            if(arr[i].deleteOrder==true){//一致する名前のマテリアルが有れば参照
                arr.splice(i,1);
                return true;
            }
        }
        return false;
    }
    Read_Vectror3(data){
        let x=parseFloat(data[1]);
        let y=parseFloat(data[2]);
        let z=parseFloat(data[3]);
        return new Vector3(x,y,z);
    }
    Intersect(ray){
        let hit;
        let result=null;
        for(let i=0;i<this.objs.length;i++){
            hit=this.IntersectbyPolys(ray,this.objs[i].polys);
            if(hit!=null){
                if(result==null || result.dist>hit.dist)result=hit;
            }
        }
        return result;
    }
    /* 特定のポリゴン集合を対象にインターセクトの取得(レイトレ高速化用関数)*/
    IntersectbyPolys(ray,polys){
        let hit;
        let result=null;
        for(let i=0;i<polys.length;i++){
            hit=polys[i].Intersect(ray);
            if(hit!=null){
                if(result==null || result.dist>hit.dist)result=hit;
            }
        }
        return result;
    }
    /*頂点情報からポリゴンが存在しうる領域を更新する関数*/
    updateRange(vertpos){
        let min=this.RangeMIN.toarray();
        let max=this.RangeMAX.toarray();
        let v=vertpos.toarray();
        for(let i=0;i<3;i++){
            if(min[i]>v[i])min[i]=v[i];
            if(max[i]<v[i])max[i]=v[i];
        }
        this.RangeMIN=new Vector3(min[0],min[1],min[2]);
        this.RangeMAX=new Vector3(max[0],max[1],max[2]);
    }
    /*objファイルのパーサで書かれたStringからオブジェクトを生成(ついでに未登録マテリアルも仮生成する) */
    addobj(str){
        let newobj=this.objs[0];//作成対象のオブジェクト
        let v=new Array();
        let vn=new Array();
        let vt=new Array();
        let nowMat=this.Materials[0];//割り当て対象のマテリアル(バグ回避のために初期マテリアルを格納)
        let strs=str.split("\n");
        for(let i=0;i<strs.length;i++){
            let elements=strs[i].split(" ");
            switch(elements[0]){
                case "v":
                    let vdata=this.Read_Vectror3(elements);
                    this.updateRange(vdata);
                    v.push(vdata);
                break;
                case "vt":
                    vt.push(this.Read_Vectror3(elements));
                break;
                case "vn":
                    vn.push(this.Read_Vectror3(elements));
                break;
                case "usemtl":
                    nowMat=this.refMaterial(elements[1]);
                break;
                case "f":
                    let poly=new Poly(nowMat);
                    let tris=elements.length-2;//ポリゴン当たりの▲数を計算
                    if(tris>0)newobj.trisnum+=tris;//三角形以上ならオブジェに加算

                    for(let varts=1;varts<elements.length;varts++){
                        let polydata=elements[varts].split("/");
                        let vid=parseInt(polydata[0]);
                        let vtid=parseInt(polydata[1]);
                        let vnid=parseInt(polydata[2]);
                        //console.log(vid+","+vtid+","+vnid);
                        poly.verts.push(new Vart(v[vid-1],vt[vtid-1],vn[vnid-1]));
                    }
                    newobj.polys.push(poly);
                break;
                case "o":
                
                    newobj=this.makeObj(elements[1]);
                break;
                default:
                    console.log(elements[0]);
                break;
            }
        }
        this.updateObjUI();
        this.updateMaterialUI();
    }
    /*mtlファイルのパーサで書かれたStringからマテリアルを生成 */
    addmtl(str){
        let newMat=this.Materials[0];//作成対象のマテリアル(バグ回避のために初期マテリアルを格納)
        let strs=str.split("\n");
        for(let i=0;i<strs.length;i++){
            let elements=strs[i].split(" ");
            switch(elements[0]){
                case "newmtl":
                    newMat=this.refMaterial(elements[1]);
                break;
                case "Ka":
                    newMat.ambient=this.Read_Vectror3(elements);
                break;
                case "Kd":
                    newMat.albedo=this.Read_Vectror3(elements);
                break;
                case "Ke":
                    newMat.emmitt=this.Read_Vectror3(elements);
                break;
                case "Ks":
                    //メタリックワークフローでの実装を考えているのでスペキュラ成分は強引に色成分の長さをメタリックに変換
                    newMat.metalic=this.Read_Vectror3(elements).dist()/Math.sqrt(3);
                break;
                case "Ns":
                    //最大値が1000なので強引に丸めて0~0.9のスムーズネスに変換
                    newMat.smoothness=parseFloat(elements[1])/1000*0.9;
                break;
                case "d":
                    newMat.Transparency=1-parseFloat(elements[1]);
                break;
                case "Tr":
                    newMat.Transparency=parseFloat(elements[1]);
                break;
                default:
                    console.log(elements[0]);
                break;
            }
        }
        this.updateMaterialUI();
    }
}