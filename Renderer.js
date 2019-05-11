/*厳密には計算高速化のためにスクリーン投影やデファードチックな処理も併用しています*/
class RenderRaytrace{
    constructor(W,H,Pos,Look,FOVX,FOVY){
        this.pos=Pos;//カメラの位置
        this.look=Look;//カメラの向いてる向き
        this.fovX=FOVX;//カメラのFovX
        this.fovY=FOVY;//カメラのFovY
        this.UI=document.createElement("div");
        
        this.scene=new SceneBuffer(W,H,ctx);//レンダリング結果格納用のシーンバッファ
        this.debug=new SceneBuffer(W,H,ctx);//頂点ビュー→ノーマルバッファ化する
        this.DebugZbuffer=new SceneBuffer(W,H,ctx);//Zバッファのデバッグ用
        this.DebugLighting=new SceneBuffer(W,H,ctx);//ライティングのデバッグ用
        this.DebugReflect=new SceneBuffer(W,H,ctx);//鏡面反射のデバッグ用
        this.up=new Vector3(0,1,0);//カメラの上向きベクトル
        this.u;this.v;this.w;this.invM;//カメラ座標系(u=縦方向,v=横方向,w=奥行き方向,invM=ワールドからカメラ座標系への変換行列(Mの逆行列))
        this.updateCameraVector();
        this.nowX=0;this.nowY=0;//現在レンダリング中のXY位置
        this._Interruptionpos=0;//前フレームで中断した位置を格納するためのバッファ
        this.renderPhase=0;//レンダリング段階
        this.renderpow=4;//レンダリング粒度(レンダリングが2のこの変数乗から始まる)
        /*以下各種バッファ(シーンバッファの画素分あります)*/
        this.Tbuf;//シーンバッファ画素分のターゲットバッファ(このピクセルに交差しうるポリゴンのみを格納している)
        this.Hbuf;//レイのヒット情報を格納
        this.Lbuf;//ライティング情報を格納
        this.renderdstates;//現在のレンダリング状態(-1=交差オブジェクト無し,0=未レンダリング,1=ジオメトリ,2=シェーディング)
        this.clearbuffer();//バッファの初期化  
        
        /*以下レンダリング設定*/
        this.shadowflag=true;//シャドウイングを行うかどうか
        this.reflectflag=true;//シャドウイングを行うかどうか

        //以下ＵＩ関連
        let Re = this;//マテリアルの参照位置を入れる（自分）
        this.UI=document.createElement("div");
        this.RenderStates=document.createElement("div");//現在のレンダリングの進捗状態を表示
        this.UI.addEventListener("change", function(evt,p=Re){
            p.setRender();//参照マテリアルからsetMaterialの呼び出し
            console.log("レンダリング情報の更新");
            Rerenderflag=true;//再レンダリングを要求する
        },false);
        let parent_object = document.getElementById("render");
        parent_object.appendChild(this.RenderStates);
        parent_object.appendChild(this.UI);
    } 
    updateUI(){
        this.UI.innerHTML ='<b>レンダラー設定</b><br>';
        this.UI.innerHTML += '位置<br>';
        this.UI.innerHTML += 'X:'+Math.ceil(this.pos.x*10)/10+' Y:'+Math.ceil(this.pos.y*10)/10+' Z:'+Math.ceil(this.pos.z*10)/10+'<br>';
        this.UI.innerHTML += 'Fov'+'<br>';
        this.UI.innerHTML += 'X<input name="fovx" type="range" name="num" min="0" max="360" step="1" value="'+this.fovX+'">'+this.fovX+'°';
        this.UI.innerHTML += 'Y<input name="fovy" type="range" name="num" min="0" max="360" step="1" value="'+this.fovY+'">'+this.fovY+'°';
        this.UI.innerHTML +="<br>";
        
        this.UI.innerHTML +="<b>カメラ操作方法</b><br>";
        this.UI.innerHTML +="前/後/左/右:A/W/D/S<br>";
        this.UI.innerHTML +="上昇/下降:Shift+W/S<br>";

        this.UI.innerHTML +='<b>実行する処理</b><br><br>';
        if(this.shadowflag)this.UI.innerHTML += '<input type="checkbox" class="checkbox" name="Shadowing" id="Shadowing" checked="checked">';
        else this.UI.innerHTML += '<input type="checkbox" class="checkbox" name="Shadowing" id="Shadowing">';
        this.UI.innerHTML += '<label class="label" for="Shadowing">シャドウイング</label>';
        if(this.reflectflag)this.UI.innerHTML += '<input type="checkbox" class="checkbox" name="Reflecting" id="Reflecting" checked="checked">';
        else this.UI.innerHTML += '<input type="checkbox" class="checkbox" name="Reflecting" id="Reflecting">';
        this.UI.innerHTML += '<label class="label" for="Reflecting">鏡面反射</label><br>';

    }
    setRender(){
        var from_child =  this.UI.children;// UIの子要素を取得
        for (var i = 0; i < from_child.length; i++){//子要素の値を取得
            switch(from_child[i].name){//名前を元に各要素に割り当てていく
                case "Shadowing":
                    this.shadowflag=from_child[i].checked;
                break;
                case "Reflecting":
                    this.reflectflag=from_child[i].checked;
                break;
                case "fovx":
                    this.fovX=from_child[i].value;
                break;
                case "fovy":
                    this.fovY=from_child[i].value;
                break;
            }
        }
        this.updateUI();
    }
    updateStatesInfo(){
        this.RenderStates.innerHTML="<b>現在のステータス</b><br>";
        let str="";
        let statesmsg=["シェーディング","シャドウィング","鏡面反射計算","完了"];//レンダリング状態を表示するための変数
        for(let i=0;i<statesmsg.length;i++) {
            if(i==this.renderPhase){
                str+="<strong>"+statesmsg[i]+"</strong>";
            }else{
                str+=statesmsg[i];
            }
            if(i<statesmsg.length-1)str+="→";
        }
        this.RenderStates.innerHTML+=str;
    }

    
    clearbuffer(){//バッファの初期化
        let buffersize=this.scene.w*this.scene.h
        this.Tbuf=new Array(buffersize);//シーンバッファ画素分のターゲットバッファ(このピクセルに交差しうるポリゴンのみを格納している)
        this.scene.clear();
        this.DebugZbuffer.clear();
        this.DebugLighting.clear();
        this.DebugReflect.clear();
        this.renderdstates=new Array(buffersize);
        this.Hbuf=new Array(buffersize);
        this.Lbuf=new Array(buffersize);
        for(let i=0;i<this.Tbuf.length;i++){
            this.Tbuf[i]=new Array();
            this.Lbuf[i]=new Array();
            this.renderdstates[i]=0;
        }

    }
    /*シーンのアップデート：カメラ座標，オブジェクト座標が変化し再レンダリングが要求されるときにバッファーをすべてクリアする */
    sceneUpdate(geom){
        this.clearbuffer();//各種バッファーの初期化
        this.updateCameraVector();//カメラ行列の再設定
        this.ObjectMapping(geom);//ポリゴンをスクリーン投影しTbufに格納
        this.renderPhase=0;//レンダリング状態を初期状態に戻す
        this.renderpow=4;
        this.nowX=0;this.nowY=0;
        this.updateUI();
    }

    
    render(geom){
        if(Rerenderflag==true){//再レンダリング要求が有った場合
            this.sceneUpdate(geom);//情報の初期化を行う
            Rerenderflag=false;
        }
        let rendersize=Math.pow(2,this.renderpow);//レンダリング粒度を設定
        switch(this.renderPhase){
            case 0: 
            /*フェーズ0(シェーディング)カメラスクリーンとジオメトリの交差情報を導出し，陰影を描画する*/
                this.Shading(rendersize,geom);
                
                if(this.renderpow<0){//シェーディング終了
                    this.renderpow=4;//レンダリング粒度を元に戻す
                    this.renderPhase=1;//シャドウイングへ
                }
            break;
            case 1:
            /*フェーズ1(シャドウイング)交差点から光源までに遮るものが無いかを導出し，影を作る*/
                if(!this.shadowflag){//シャドウイングしなければ
                    this.RenderSkip(1,2);//レンダリング過程をスキップする
                    this.renderPhase++;//次の処理へ
                    this.renderpow=4;//レンダリング粒度を元に戻す
                    break;
                }
                this.Shadowing(rendersize,geom);
                if(this.renderpow<0){//シャドウイング終了
                    this.renderPhase=2;
                    this.renderpow=4;
                }
            break;
            case 2:
            /*フェーズ1(シャドウイング)交差点から光源までに遮るものが無いかを導出し，影を作る*/
                if(!this.reflectflag){//シャドウイングしなければ
                    this.RenderSkip(2,3);//レンダリング過程をスキップする
                    this.renderPhase++;//次の処理へ
                    break;
                }
                this.Reflect(rendersize,geom);
                if(this.renderpow<0){//ジオメトリレンダリング終了
                    this.renderPhase=3;
                    this.renderpow=4;
                }
            break;
            case 3://完了
            break;
        }
    }
    /*レンダリング処理をスキップする関数 */
    RenderSkip(before,next){
        for(let y=0;y<this.scene.h;y++){
            for(let x=0;x<this.scene.w;x++){
                let bufferpos=y*this.scene.w+x;
                if(this.renderdstates[bufferpos]==before){//対応ピクセルがbeforeの処理済なら
                    this.renderdstates[bufferpos]=next;//強制的にnext処理を完了状態にする
                }
            }
        }
    }
    //SSAOを行う関数．
    SSAO(rendersize,geom){
        //途中中断したレンダリングを再開するための変数
        let progressX=this._Interruptionpos%this.scene.w;
        let progressY=Math.floor(this._Interruptionpos/this.scene.w);
        for(let y=progressY;y<this.scene.h;y+=rendersize){
            for(let x=progressX;x<this.scene.w;x+=rendersize){
                let bufferpos=y*this.scene.w+x;
                if(this.renderdstates[bufferpos]==3){//対応ピクセルがシェーディング済ならシャドウイングを行う
                    let Sample=0;
                    //実装したい
                    this.renderdstates[bufferpos]=4;//シャドウイングを完了状態にする
                    /*//レンダリング開始から描画周期の半分以上の時間がかかっている場合，
                    時間切れと判断し,作業を打ち切って表示する */
                    if(Date.now()-framestart>flamedelta/2){
                        this._Interruptionpos=bufferpos;//この処理におけるレンダリング行程進捗度にはbufferposを格納
                        return;
                    }
                }
            }
            progressX=0;
        }
        this._Interruptionpos=0;//レンダリングが一回り終了したので進捗度を初期化
        this.renderpow--;
    }
    //シャドウイングを行う関数．影が出来ると判断した部位のみ更新するのでシェーディングをあらかじめやっておくことが前提
    Shadowing(rendersize,geom){
        //途中中断したレンダリングを再開するための変数
        let progressX=this._Interruptionpos%this.scene.w;
        let progressY=Math.floor(this._Interruptionpos/this.scene.w);
        for(let y=progressY;y<this.scene.h;y+=rendersize){
            for(let x=progressX;x<this.scene.w;x+=rendersize){
                let bufferpos=y*this.scene.w+x;
                if(this.renderdstates[bufferpos]==1){//対応ピクセルがシェーディング済ならシャドウイングを行う
                    if(this.getliting(this.Hbuf[bufferpos],geom.Lights,geom,this.Lbuf[bufferpos]).length<geom.Lights.length){//衝突位置の光源情報を求める(影計算有り)
                        this.scene.color[bufferpos]=this.Hbuf[bufferpos].poly.mat.Shading(this.Lbuf[bufferpos],this.Hbuf[bufferpos]);//シェーディングを計算しなおす
                    }
                    
                    //this.DebugLighting.color[bufferpos].x=this.Lbuf[bufferpos].length/geom.Lights.length;
                    for(let i=0;i<this.Lbuf[bufferpos].length;i++){
                        this.DebugLighting.color[bufferpos]=this.DebugLighting.color[bufferpos].add(this.Lbuf[bufferpos][i].color.mult(0.1));
                    }
                    this.renderdstates[bufferpos]=2;//シャドウイングを完了状態にする
                    /*//レンダリング開始から描画周期の半分以上の時間がかかっている場合，
                    時間切れと判断し,作業を打ち切って表示する */
                    if(Date.now()-framestart>flamedelta/2){
                        this._Interruptionpos=bufferpos;//この処理におけるレンダリング行程進捗度にはbufferposを格納
                        return;
                    }
                }
            }
            progressX=0;
        }
        this._Interruptionpos=0;//レンダリングが一回り終了したので進捗度を初期化
        this.renderpow--;
    }
    //反射を計算する関数
    Reflect(rendersize,geom){
         //途中中断したレンダリングを再開するための変数
         let progressX=this._Interruptionpos%this.scene.w;
         let progressY=Math.floor(this._Interruptionpos/this.scene.w);
         for(let y=progressY;y<this.scene.h;y+=rendersize){
             for(let x=progressX;x<this.scene.w;x+=rendersize){
                 let bufferpos=y*this.scene.w+x;
                 if(this.renderdstates[bufferpos]==2){//対応ピクセルがシャドウイング済なら反射計算を行う
                    //反射先から得た色を光源として取り込み，スペキュラ成分の量だけ加算する．
                    /*参考サイト：http://marupeke296.com/COL_Basic_No5_WallVector.html*/
                    let Rcolor=this.Hbuf[bufferpos].poly.mat.ReflectShading(this.getReflectinfo(this.Hbuf[bufferpos],geom,1));
                    this.DebugReflect.color[bufferpos]=Rcolor;//デバッグ用に鏡面反射成分のみを格納
                    this.scene.color[bufferpos]=this.scene.color[bufferpos].add(Rcolor);//鏡面反射成分を反映させる
                    this.renderdstates[bufferpos]=3;
                    /*//レンダリング開始から描画周期の半分以上の時間がかかっている場合，
                    時間切れと判断し,作業を打ち切って表示する */
                    if(Date.now()-framestart>flamedelta/2){
                        this._Interruptionpos=bufferpos;//この処理におけるレンダリング行程進捗度にはbufferposを格納
                        return;
                    }
                }
             }
             progressX=0;
         }
         this._Interruptionpos=0;//レンダリングが一回り終了したので進捗度を初期化
         this.renderpow--;
    }
    //反射先の情報を求める
    getReflectinfo(hit,geom,num){
        let Reflectvec= (hit.ray.dir.sub(hit.snor.mult(hit.ray.dir.dot(hit.snor)*2))).normalized();  // 鏡面反射方向のベクトルを格納
        let ray=new Ray(hit.pos.add(hit.snor.mult(0.00001)), Reflectvec);//pから反射方向へ向かうレイを作成．（n * pow(10, -5)）を足すのは計算誤差より自らのポリゴンを検出しないため
        let Rhit=geom.Intersect(ray);//反射先のHitinfoを格納
        if(Rhit==null){return new Vector3(0,0,0)};//反射先に何もなかった場合(画像が使えればライトマップを参照するのが理想？)
        
        let Lbuf=this.getliting(Rhit,geom.Lights,geom)//衝突位置の光源情報を求める(影計算有り)
        let result=Rhit.poly.mat.Shading(Lbuf,Rhit);//反射先のシェーディングを格納
        if(num>0){
            return result.add(Rhit.poly.mat.ReflectShading(this.getReflectinfo(Rhit,geom,num-1)));//再帰的に反射色を読み出し、加える
        }

        return result;//シェーディングを計算し,光源情報として格納
    }
    findcolor(hit,Lights,geom=null,lbuf=new Array()){//取得したライティング情報から色を求める
        for(let i=0;i<Lights.length;i++){
            let lightinfo=Lights[i].Intersect(hit,geom);
            if(lightinfo!=null){
                lbuf.push(lightinfo);
            }
        }
        return hit.poly.mat.Shading(lbuf,hit).clamp(0,1).mult(255).parseIntVec();
    }
    getliting(hit,Lights,geom=null,lbuf=new Array()){//ライティング情報を取得する
        for(let i=0;i<Lights.length;i++){
            let lightinfo=Lights[i].Intersect(hit,geom);
            if(lightinfo!=null){
                lbuf.push(lightinfo);
            }
        }
        return lbuf;
    }
    /*おおまかなシェーディングを行う関数．カメラスクリーンとジオメトリの交差情報を導出する．引数は粒度(1ピクセルの大きさ)*/
    Shading(rendersize,geom){
        //途中中断したレンダリングを再開するための変数
        let progressX=this._Interruptionpos%this.scene.w;
        let progressY=Math.floor(this._Interruptionpos/this.scene.w);
        for(let y=progressY;y<this.scene.h;y+=rendersize){
            for(let x=progressX;x<this.scene.w;x+=rendersize){
                let bufferpos=y*this.scene.w+x;
                if(this.renderdstates[bufferpos]==0){//対応ピクセルが未レンダリングならレンダリング実行
                    let ray=this.RayThruPixel(x,y);
                    let hit=geom.IntersectbyPolys(ray,this.Tbuf[bufferpos]);
                    if(hit!=null){
                        let lbuf=this.getliting(hit,geom.Lights);//衝突位置の光源情報を求める(影計算無し)
                        this.scene.setRect(bufferpos,rendersize,rendersize,hit.poly.mat.Shading(lbuf,hit));//シェーディングを計算
                        this.debug.setpixel(bufferpos,hit.poly.mat.normalshading(hit));//ノーマルバッファの格納
                        this.DebugZbuffer.color[bufferpos]=new Vector3(0,hit.dist/10,0);//Zバッファ
                        this.renderdstates[bufferpos]=1;//シェーディングを完了状態にする
                        this.Hbuf[bufferpos]=hit;
                    }
                    else{
                        this.renderdstates[bufferpos]=-1;//交差点無しと判断し,これ以後レンダリングしない
                        this.scene.setRect(bufferpos,rendersize,rendersize,new Vector3(0,0,0));
                    }        
                }
                /*//レンダリング開始から描画周期の半分以上の時間がかかっている場合，
                時間切れと判断し,作業を打ち切って表示する */
                if(this.renderpow<4 && Date.now()-framestart>flamedelta/2){
                    this._Interruptionpos=bufferpos;//この処理におけるレンダリング行程進捗度にはbufferposを格納
                    return;
                }
            }
            progressX=0;
        }
        this._Interruptionpos=0;//レンダリングが一回り終了したので進捗度を初期化
        this.renderpow--;
    }
    /*カメラ座標からそこを通るレイを割り出す */
    RayThruPixel(x,y)
	{
		//FoVの計算．α*u + β*v + wでレイの向きが求まる．
		let a = Math.tan(this.fovX / (360.0*2)*Math.PI)*(((this.scene.w / 2.0) - x) / (this.scene.w / 2.0));
	    let b = Math.tan(this.fovY / (360.0*2)*Math.PI)*(((this.scene.h / 2.0) - y) / (this.scene.h / 2.0));
        let direction = (this.u.mult(a).add(this.v.mult(b).add(this.w))).normalized();//α*u + β*v + wの計算，今後の簡略のため，ここで正規化して単位ベクトルに変換しておく
		let origin = this.pos;//レイの原点をカメラ原点に設定
		return new Ray(origin, direction);
    }
    /*頂点座標からカメラ座標を割り出す.戻り値は配列に格納 */
    RayThruVert(vpos)
    {
        let vertpos=this.pos.sub(vpos).coordinate_transformation(this.invM);//invMを用いてカメラから頂点へのレイをカメラ座標系に変換
        if(vertpos.z>=0)return null;
        let x=(this.scene.w/2.0)-(this.scene.w/2.0)*(vertpos.x/vertpos.z)/Math.tan(this.fovX/(360.0*2)*Math.PI);
        let y=(this.scene.h/2.0) -(this.scene.h/2.0)*(vertpos.y/vertpos.z)/Math.tan(this.fovY/(360.0*2)*Math.PI);
        x=Math.ceil(x);
        y=Math.ceil(y);
        return [x,y];
    }
    /*レイトレーシング高速化にあたってポリゴンをスクリーン投影し矩形でTbufにマッピングする
    Tbufは最初の交差判定で参照回数を減らし，高速化を図るために使用 */
    ObjectMapping(geom){
        renderer.debug.clear();
        for(let i=0;i<geom.objs.length;i++){
            for(let j=0;j<geom.objs[i].polys.length;j++){
                let maxx=0,minx=this.scene.w,miny=this.scene.h,maxy=0;
                for(let k=0;k<geom.objs[i].polys[j].verts.length;k++){
                    let p=this.RayThruVert(geom.objs[i].polys[j].verts[k].pos);
                    if(p!=null){
                        this.debug.setpixel(this.debug.getbufferpos(p[0],p[1]),new Vector3(1,1,1));
                        if(p[0]>maxx)maxx=p[0];if(p[0]<minx)minx=p[0];
                        if(p[1]>maxy)maxy=p[1];if(p[1]<miny)miny=p[1];
                    }else{
                        break;
                    }
                }
                minx-=1;maxx+=1;miny-=1;maxy+=1;//計算誤差対策の為両端+3ずつ余裕を持たせる
                if(minx<0)minx=0;if(maxx>this.scene.w)maxx=this.scene.w;if(miny<0)miny=0;if(maxy>this.scene.h)maxy=this.scene.h;
                if(maxx==0||minx==this.scene.w||maxy==0||miny==this.scene.h)continue;
                for(let yt=miny;yt<maxy;yt++){
                    var pos=(yt)*this.scene.w;
                    for(let xt=0;xt<maxx-minx;xt++){
                        this.Tbuf[pos+minx+xt].push(geom.objs[i].polys[j]);
                    }
                }
            }
        }
    }
    /*カメラのベクトルu,v,wを更新する */
    updateCameraVector(){
        this.w = this.look.normalized();//(this.look.sub(this.pos)).normalized();//wはカメラのLookAt-LookFromで求まる
		this.u = this.up.normalized().cross(this.w).normalized();//uはカメラのUPとwの正規直交系
        this.v = this.w.cross(this.u);//vはwとuの外積を用いて導出することが出来る
        this.invM=[this.u.toarray(),this.v.toarray(),this.w.toarray()];//カメラ座標系への変換行列を作成
        //tips:ここの外積の順番によってはレンダリング結果が上下及び左右が反転することがある．
    }
}