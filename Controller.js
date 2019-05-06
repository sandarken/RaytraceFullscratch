class KeyButton{
    constructor(num){
        this.state=0;
        this.Keynum=num;
    }
    /**ベクトルの要素を整数に丸める */
    KeyDown(num){
        if(num==this.Keynum &&this.state <1){
            this.state=1;
        }
    }
    KeyUp(num){
        if(num==this.Keynum){
            this.state=-2;
        }
    }
    //キーの認識は非同期であるため少しラグがあっても「押した瞬間」を取得するためには３段階遷移を行い中間フレームを押した瞬間と判断しなければならない
    //その処理を行うための関数
    Update(){
        if(this.state==0){
            return;
        }else if(this.state>0 ){
            if(this.state<3){
                this.state++;//1,2,3と遷移していく（つまり押した瞬間を処理するのは2のとき）
            }
        }else {
            this.state++;//-2,-1,0と遷移していく（つまり離した瞬間を処理するのは-1のとき）
        }
    }
    GetKeyDown(){
        if(this.state==2)return true;
        return false;
    }
    GetKeyUp(){
        if(this.state==-1)return true;
        return false;
    }
    GetKey(){
        if(this.state>0)return true;
        return false;
    }
}