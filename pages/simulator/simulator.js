// pages/simulator/simulator.js
var canvas=null;
var ctx=null;
const dpr=wx.getSystemInfoSync().pixelRatio;
var canvasElements=null;
var simu_panel_pos=null;
var instance=null;
var result_index=0;

function turing_machine(data) {
    let state=[];
    let initial_state=null;
    let final_state=[];
    let paper="";
    let simulation_start=false;
    let hashmap=null;
    let accepted=false;
    this.isfinal=function(name){
        if((name in hashmap) && hashmap[name].isEnd==1)
            return true;
        return false;
    }

    let que=[]; 
    this.generate=function(){
        hashmap={};
        state=data.state;
        let findByName=function(name){
            for(let i=0;i<state.length;i++)
                if(state[i].name==name)
                    return state[i];
            return null;
        }
        for(let i=0;i<state.length;i++){
            hashmap[state[i].name]=state[i];
            if(state[i].isStart)
                initial_state=i;
            if(state[i].isEnd)
                final_state.push(i);
            state[i].transfer=[];
            data.func.forEach(elem=>{
                if(elem.begin_state==state[i].name){
                    let vec=null;
                    if(typeof(elem.text)=="string"){
                        vec=[elem.text];
                    }else{
                        vec=elem.text;
                    }
                    vec.forEach(txt=>{
                        state[i].transfer.push({
                            to: findByName(elem.end_state),
                            read: txt[0],
                            write: txt[2],
                            move: txt[4]
                        });
                    });
                }
            });
        }
    }
    this.check=function() {
        let init_cnt=0;
        let final_cnt=0;
        if(data==null)
            return false;
        data.state.forEach(elem=>{
            if(elem.isStart)
                init_cnt++;
            if(elem.isEnd)
                final_cnt++;
        });
        if(init_cnt>1){
            wx.showToast({title:'只能有一个初态',icon:'error',duration:800});
            return false;
        }else if(init_cnt==0){
            wx.showToast({title:'至少有一个初态',icon:'error',duration:800});
            return false;
        }
        if(final_cnt==0){
            wx.showToast({title:'至少有一个终态',icon:'error',duration:800});
            return false;
        }
        return true;
    }
    this.setpaper=function(str){
        paper=str.split("");
    }
    this.isrunning=function(){
        return simulation_start;
    }
    this.start=function(){
        simulation_start=true;
        accepted=false;
        // state paper pointer
        let init=state[initial_state];
        // initial state,deep copy of paper,pointer,execute path
        que=[[init,[...paper],0,""+init.name]];
        init.fillcolor="#88c3ff";
    }
    this.stop=function(){
        simulation_start=false;
    }
    this.next=function(){
        accepted=false;
        let vec=[];
        // remove highlight
        que.forEach(elem=>{
            elem[0].fillcolor="#ffe985";
        });
        que.forEach(elem=>{
            let state=elem[0];
            let p=elem[1];
            state.transfer.forEach(e=>{
                // avoid result length overflow
                // this may cause fatal memory
                if(vec.length>=1024)
                    return;
                let ptr=elem[2];
                if(ptr>p.length){
                    return;
                }
                if(e.read==p[ptr] || e.read=="ε"){
                    let tmp=[...p];
                    tmp[ptr]=e.write;
                    if(e.move=="L"){
                        ptr--;
                    }else if(e.move=="R"){
                        ptr++;
                    }
                    if(ptr<0){
                        tmp.unshift(null);
                        ptr=0;
                    }else if(ptr>tmp.length){
                        tmp.push(null);
                    }
                    vec.push([e.to,tmp,ptr,elem[3]+":"+e.to.name]);
                }else{
                    return;
                }
            });
        });
        if(vec.length==0){
            wx.showToast({
                title: '运行结束',
                icon: 'none',
                duration: 800
            });
            this.stop();
            return;
        }
        // highlight nodes
        que=vec;
        que.forEach(elem=>{
            elem[0].fillcolor="#88c3ff";
            if(elem[0].isEnd)
                accepted=true;
        });
        if(que.length>=1024){
            wx.showToast({
                title: '结果数量溢出',
                icon: 'error',
                duration: 1000
            });
            accepted=false;
            this.stop();
        }
    }
    this.result=function(){
        return que;
    }
    this.accept=function(){
        return accepted;
    }
}

function multi_tape_machine(data) {
    let state=[];
    let initial_state=null;
    let final_state=[];
    let paper_num=data.tape;
    let paper=[];
    let simulation_start=false;
    let hashmap=null;
    let accepted=false;
    this.isfinal=function(name){
        if((name in hashmap) && hashmap[name].isEnd==1)
            return true;
        return false;
    }

    let que=[]; 
    this.generate=function(){
        hashmap={};
        state=data.state;
        let findByName=function(name){
            for(let i=0;i<state.length;i++)
                if(state[i].name==name)
                    return state[i];
            return null;
        }
        for(let i=0;i<state.length;i++){
            hashmap[state[i].name]=state[i];
            if(state[i].isStart)
                initial_state=i;
            if(state[i].isEnd)
                final_state.push(i);
            state[i].transfer=[];
            data.func.forEach(elem=>{
                if(elem.begin_state==state[i].name){
                    let vec=null;
                    if(typeof(elem.text)=="string"){
                        vec=[elem.text];
                    }else{
                        vec=elem.text;
                    }
                    vec.forEach(txt=>{
                        let tmp={
                            to: findByName(elem.end_state),
                                read: [],
                                write: [],
                                move: []
                        }
                        for(let i=0;i<paper_num;i++){
                            tmp.read.push(txt[i*6]);
                            tmp.write.push(txt[i*6+2]);
                            tmp.move.push(txt[i*6+4]);
                        }
                        state[i].transfer.push(tmp);
                    });
                }
            });
        }
    }
    this.check=function() {
        let init_cnt=0;
        let final_cnt=0;
        if(data==null)
            return false;
        data.state.forEach(elem=>{
            if(elem.isStart)
                init_cnt++;
            if(elem.isEnd)
                final_cnt++;
        });
        if(init_cnt>1){
            wx.showToast({title:'只能有一个初态',icon:'error',duration:800});
            return false;
        }else if(init_cnt==0){
            wx.showToast({title:'至少有一个初态',icon:'error',duration:800});
            return false;
        }
        if(final_cnt==0){
            wx.showToast({title:'至少有一个终态',icon:'error',duration:800});
            return false;
        }
        return true;
    }
    this.setpaper=function(str,index=0){
        // check if paper is a correct vector
        if(paper.length<paper_num){
            paper=[];
            for(let i=0;i<paper_num;i++)
                paper.push([]);
        }
        paper[index]=str.split("");
    }
    this.isrunning=function(){
        return simulation_start;
    }
    this.start=function(){
        simulation_start=true;
        accepted=false;
        // state paper pointer
        let init=state[initial_state];
        let ptrs=[];
        for(let i=0;i<paper_num;i++)
            ptrs.push(0);
        // initial state,deep copy of paper,pointer,execute path
        que=[[init,[...paper],ptrs,""+init.name]];
        init.fillcolor="#88c3ff";
    }
    this.stop=function(){
        simulation_start=false;
    }
    this.next=function(){
        accepted=false;
        let vec=[];
        // remove highlight
        que.forEach(elem=>{
            elem[0].fillcolor="#ffe985";
        });
        que.forEach(elem=>{
            let state=elem[0];
            let p=elem[1];
            let ptrs=elem[2];
            state.transfer.forEach(e=>{
                // avoid result length overflow
                // this may cause fatal memory
                if(vec.length>=1024)
                    return;
                for(let i=0;i<paper_num;i++){
                    let ptr=ptrs[i];
                    if(ptr>p[i].length)
                        return;
                    if(e.read[i]!=p[i][ptr] && e.read[i]!="ε")
                        return;
                }
                let new_papers=[];
                let new_ptrs=[];
                for(let i=0;i<paper_num;i++){
                    let tmp=[...p[i]];
                    let ptr=ptrs[i];
                    tmp[ptr]=e.write[i];
                    if(e.move[i]=="L"){
                        ptr--;
                    }else if(e.move[i]=="R"){
                        ptr++;
                    }
                    if(ptr<0){
                        tmp.unshift(null);
                        ptr=0;
                    }else if(ptr>tmp.length){
                        tmp.push(null);
                    }
                    new_papers.push(tmp);
                    new_ptrs.push(ptr);
                }
                vec.push([e.to,new_papers,new_ptrs,elem[3]+":"+e.to.name]);
            });
        });
        if(vec.length==0){
            wx.showToast({
                title: '运行结束',
                icon: 'none',
                duration: 800
            });
            this.stop();
            return;
        }
        // highlight nodes
        que=vec;
        que.forEach(elem=>{
            elem[0].fillcolor="#88c3ff";
            if(elem[0].isEnd)
                accepted=true;
        });
        if(que.length>=1024){
            wx.showToast({
                title: '结果数量溢出',
                icon: 'error',
                duration: 1000
            });
            accepted=false;
            this.stop();
        }
    }
    this.result=function(){
        return que;
    }
    this.accept=function(){
        return accepted;
    }
}

function sub_prog_turing_machine(data) {
    let state=[];
    let initial_state=null;
    let final_state=[];
    let paper="";
    let simulation_start=false;
    let hashmap=null;
    let accepted=false;
    this.isfinal=function(name){
        if((name in hashmap) && hashmap[name].isEnd==1)
            return true;
        return false;
    }

    let que=[]; 
    this.generate=function(){
        hashmap={};
        state=data.state;
        let findByName=function(name){
            for(let i=0;i<state.length;i++)
                if(state[i].name==name)
                    return state[i];
            return null;
        }
        for(let i=0;i<state.length;i++){
            hashmap[state[i].name]=state[i];
            if(state[i].isStart)
                initial_state=i;
            if(state[i].isEnd)
                final_state.push(i);
            state[i].transfer=[];
            data.func.forEach(elem=>{
                if(elem.begin_state==state[i].name){
                    let vec=null;
                    if(typeof(elem.text)=="string"){
                        vec=[elem.text];
                    }else{
                        vec=elem.text;
                    }
                    vec.forEach(txt=>{
                        state[i].transfer.push({
                            to: findByName(elem.end_state),
                            read: txt[0],
                            write: txt[2],
                            move: txt[4]
                        });
                    });
                }
            });
        }
    }
    this.check=function() {
        let init_cnt=0;
        let final_cnt=0;
        if(data==null)
            return false;
        data.state.forEach(elem=>{
            if(elem.isStart)
                init_cnt++;
            if(elem.isEnd)
                final_cnt++;
        });
        if(init_cnt>1){
            wx.showToast({title:'只能有一个初态',icon:'error',duration:800});
            return false;
        }else if(init_cnt==0){
            wx.showToast({title:'至少有一个初态',icon:'error',duration:800});
            return false;
        }
        if(final_cnt==0){
            wx.showToast({title:'至少有一个终态',icon:'error',duration:800});
            return false;
        }
        return true;
    }
    this.setpaper=function(str){
        paper=str.split("");
    }
    this.isrunning=function(){
        return simulation_start;
    }
    this.start=function(){
        simulation_start=true;
        accepted=false;
        // state paper pointer
        let init=state[initial_state];
        // initial state,deep copy of paper,pointer,execute path
        que=[[init,[...paper],0,""+init.name]];
        init.fillcolor="#88c3ff";
    }
    this.stop=function(){
        simulation_start=false;
    }
    this.subprogram=function(){
        // let count=0;
        // while(instance.isrunning()){
        //     instance.next();
        //     result_index=0;
        //     count+=1;
        //     if(count==200 || instance.accept())
        //         break;
        // }
        // if(count==200){
        //     wx.showToast({title:'执行次数过多,暂停',icon:'none',duration:1500});
        // }else if(instance.accept()){
        //     wx.showToast({title:'有接受状态，暂停',icon:'none',duration:1000});
        // }
    }
    this.next=function(){
        accepted=false;
        let vec=[];
        // remove highlight
        que.forEach(elem=>{
            elem[0].fillcolor="#ffe985";
        });
        que.forEach(elem=>{
            let state=elem[0];
            let p=elem[1];
            state.transfer.forEach(e=>{
                // avoid result length overflow
                // this may cause fatal memory
                if(vec.length>=1024)
                    return;
                let ptr=elem[2];
                if(ptr>p.length){
                    return;
                }
                if(e.read==p[ptr] || e.read=="ε"){
                    let tmp=[...p];
                    tmp[ptr]=e.write;
                    if(e.move=="L"){
                        ptr--;
                    }else if(e.move=="R"){
                        ptr++;
                    }
                    if(ptr<0){
                        tmp.unshift(null);
                        ptr=0;
                    }else if(ptr>tmp.length){
                        tmp.push(null);
                    }
                    vec.push([e.to,tmp,ptr,elem[3]+":"+e.to.name]);
                }else{
                    return;
                }
            });
        });
        if(vec.length==0){
            wx.showToast({
                title: '运行结束',
                icon: 'none',
                duration: 800
            });
            this.stop();
            return;
        }
        // highlight nodes
        que=vec;
        que.forEach(elem=>{
            elem[0].fillcolor="#88c3ff";
            if(elem[0].isEnd)
                accepted=true;
        });
        if(que.length>=1024){
            wx.showToast({
                title: '结果数量溢出',
                icon: 'error',
                duration: 1000
            });
            accepted=false;
            this.stop();
        }
    }
    this.result=function(){
        return que;
    }
    this.accept=function(){
        return accepted;
    }
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        height:null,
        width:null,
        acc:null,
        panel_height:80,
        panel_selected:false
    },

    /**
     * 根据名称查找状态
     */
    findState: function(name) {
        let vec=canvasElements.state;
        for(let i=0;i<vec.length;i++)
            if(vec[i].name==name)
                return vec[i];
        return null;
    },

    /** 
     * 初始化文字格式 
     */
    textStyle: function() {
        ctx.font="10rpx sans-serif"
        ctx.textAlign="center";
        ctx.textBaseline="middle";
    },

    /**
     * 绘制状态
     */
    drawState: function(name,x,y,r,color) {
        ctx.strokeStyle="#606266";
        // draw circle
        ctx.beginPath();
        ctx.arc(x,y,r,0,2*Math.PI);
        ctx.fillStyle=color;
        ctx.fill();
        ctx.stroke();
        // set text
        ctx.fillStyle="#606266";
        ctx.fillText(name,x,y);
    },

    /**
     * 绘制初态侧面三角形
     */
    drawStateStart: function(x,y,r) {
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#e1f3d8";
        ctx.beginPath();
        ctx.moveTo(x-r,y);
        ctx.lineTo(x-r-0.5*r,y-0.7*r);
        ctx.lineTo(x-r-0.5*r,y+0.7*r);
        ctx.lineTo(x-r,y);
        ctx.fill();
        ctx.stroke();
    },

    /**
     * 绘制终态的小圆环
     */
    drawStateEnd: function(x,y,r) {
        ctx.strokeStyle="#606266";
        ctx.beginPath();
        ctx.arc(x,y,r,0,2*Math.PI);
        ctx.stroke();
    },

    /**
     * 绘制子程序节点的特别部分
    */
    drawSubProgram: function(x,y) {
        ctx.save();
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#e1f3d8";
        ctx.beginPath();
        ctx.moveTo(x-6,y-9);
        ctx.lineTo(x+6,y-9);
        ctx.lineTo(x+6,y-7);
        ctx.lineTo(x-6,y-7);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        for(let i=-3;i<=3;i+=3){
            ctx.beginPath();
            ctx.moveTo(x+i,y-9);
            ctx.lineTo(x+i,y-7);
            ctx.stroke();
        }
        ctx.restore();
    },

    /**
     * 绘制直线箭头
     */
    drawArrow: function(bx,by,ex,ey,transfer) {
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#606266";

        let angle=Math.atan2(ey-by,ex-bx);
        bx+=15*Math.cos(angle);
        by+=15*Math.sin(angle);
        ex-=15*Math.cos(angle);
        ey-=15*Math.sin(angle);
        angle=angle/Math.PI*180;

        ctx.beginPath();
        ctx.moveTo(bx,by);
        ctx.lineTo(ex,ey);
        ctx.stroke();
        
        let angle0=(30-angle)/180*Math.PI;
        let angle1=(60-angle)/180*Math.PI;
        ctx.beginPath();
        ctx.moveTo(ex,ey);
        ctx.lineTo(ex-8*Math.cos(angle0),ey+8*Math.sin(angle0));
        ctx.lineTo(ex-8*Math.sin(angle1),ey-8*Math.cos(angle1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill text
        ctx.save();
        ctx.translate((bx+ex)/2,(by+ey)/2);
        if(angle<-90)     angle+=180;
        else if(angle>90) angle-=180;
        ctx.rotate(angle*Math.PI/180);
        ctx.fillText(transfer,0,-8);
        ctx.restore();
    },

    /**
     * 绘制弧线箭头
     */
     drawArcArrow: function(bx,by,ex,ey,transfer) {
        // avoid special situation
        if(ex==bx)
            ex+=0.01;
        if(ey==by)
            ey+=0.01;
        ctx.strokeStyle="#606266";
        ctx.fillStyle="#606266";

        let O_x,O_y,m=10,k=(ey-by)/(ex-bx); //圆心,凸点距离状态圆心连线的直线距离
        let M=Math.sqrt((ey-by)*(ey-by)+(ex-bx)*(ex-bx))/2; //直线长度的一半
        let R=(M*M+m*m)/(m*2); //圆半径
        let i=(R-m)/Math.sqrt(k*k+1);
        if(bx<ex && by<ey){
            O_x=(ex+bx)/2-Math.abs(k)*i;
            O_y=(ey+by)/2+i;
        }else if(bx>ex && by>ey){
            O_x=(ex+bx)/2+Math.abs(k)*i;
            O_y=(ey+by)/2-i;
        }else if(bx<ex && by>ey){
            O_x=Math.abs(k)*i+(ex+bx)/2;
            O_y=(ey+by)/2+i;
        }else{
            O_x=(ex+bx)/2-Math.abs(k)*i;
            O_y=(ey+by)/2-i;
        }
        ctx.moveTo(bx,by);
        ctx.beginPath();
        let bAngle=Math.atan(Math.abs(by-O_y)/Math.abs(bx-O_x));
        let eAngle=Math.atan(Math.abs(ey-O_y)/Math.abs(ex-O_x));
        if(bx<O_x)
            bAngle=Math.PI+(O_y-by)/Math.abs(O_y-by)*bAngle;
        else
            bAngle=(by<O_y)?(2*Math.PI-bAngle):bAngle;
        if(ex<O_x)
            eAngle=Math.PI+(O_y-ey)/Math.abs(O_y-ey)*eAngle;
        else
            eAngle=(ey<O_y)?(2*Math.PI-eAngle):eAngle;
        ctx.arc(O_x,O_y,R,bAngle+Math.asin(15/R),eAngle-Math.asin(15/R));
        ctx.stroke();
        
        let ta_x,ta_y;
        if((ex<bx && O_y-ey<=7.5) || (ex>bx && ey>by && ey-O_y>=7.5)){
            if(ey<by || (ey>by && O_x-ex>7.5)){
                ta_x=ex+15*Math.abs(O_y-ey)/R;
                ta_y=ey+15*Math.abs(O_x-ex)/R;
            }else{
                ta_x=ex+15*Math.abs(O_y-ey)/R;
                ta_y=ey-15*Math.abs(O_x-ex)/R;
            }
        }else{
            if(ey>by || (ey<by && ex-O_x>7.5)){
                ta_x=ex-15*Math.abs(O_y-ey)/R;
                ta_y=ey-15*Math.abs(O_x-ex)/R;
            }else{
                ta_x=ex-15*Math.abs(O_y-ey)/R;
                ta_y=ey+15*Math.abs(O_x-ex)/R;
            }
        }
        
        let angle=Math.atan2(ey-by,ex-bx)/Math.PI*180;
        let angle0=(30-angle)/180*Math.PI;
        let angle1=(60-angle)/180*Math.PI;
        ctx.beginPath();
        ctx.moveTo(ta_x,ta_y);
        ctx.lineTo(ta_x-8*Math.cos(angle0),ta_y+8*Math.sin(angle0));
        ctx.lineTo(ta_x-8*Math.sin(angle1),ta_y-8*Math.cos(angle1));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill text
        let fill_x=O_x+((ex+bx)/2-O_x)*(R/(R-m));
        let fill_y=O_y+((ey+by)/2-O_y)*(R/(R-m));
        ctx.save();
        ctx.translate(fill_x,fill_y);
        if(angle<-90)     angle+=180;
        else if(angle>90) angle-=180;
        ctx.rotate(angle*Math.PI/180);
        ctx.fillStyle="#606266";
        if(ex<bx) ctx.fillText(transfer,0,8);
        else      ctx.fillText(transfer,0,-8);
        ctx.restore();
    },

    /**
     * 绘制指向自己的箭头
     */
    drawSelfArrow: function(x,y,transfer) {
        ctx.strokeStyle="#606266";
        x-=15;
        y+=15;
        ctx.beginPath();
        ctx.arc(x,y,10,0,1.5*Math.PI);  
        ctx.stroke();

        let angle=Math.PI/3;
        let res_sin=6.5*Math.sin(angle);
        let res_cos=6.5*Math.cos(angle);

        ctx.beginPath();
        ctx.moveTo(x,y-10);
        ctx.lineTo(x-res_cos,y-10+res_sin);
        ctx.lineTo(x-res_sin,y-10-res_cos);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // fill text
        ctx.fillText(transfer,x-4,y+16);
    },

    /**
     * 绘制纸带模拟状态栏
     */
    drawPaper: function() {
        ctx.strokeStyle="#606266";
        const width=this.data.width;
        const acc=this.data.acc;
        const panel_height=this.data.panel_height;
        let x=acc;
        let y=simu_panel_pos;

        // draw panel base
        // width: this.data.width-2
        // height: this.data.panel_height
        ctx.beginPath();
        ctx.moveTo(acc,y);
        ctx.lineTo(width-acc,y);
        ctx.quadraticCurveTo(width-1,y,width-1,y+10);
        ctx.lineTo(width-1,y+10);
        ctx.lineTo(width-1,y+panel_height-10);
        ctx.quadraticCurveTo(width-1,y+panel_height,width-acc,y+panel_height);
        ctx.lineTo(width-acc,y+panel_height);
        ctx.lineTo(acc,y+panel_height);
        ctx.quadraticCurveTo(1,y+panel_height,1,y+panel_height-10);
        ctx.lineTo(1,y+panel_height-10);
        ctx.lineTo(1,y+10);
        ctx.quadraticCurveTo(1,y,acc,y);
        ctx.closePath();
        ctx.fillStyle="#f2f6fc";
        ctx.fill();
        ctx.stroke();

        // draw paper
        y+=8;
        ctx.save();
        ctx.fillStyle="#606266";
        ctx.textAlign="left"
        ctx.font="8rpx sans-serif"
        let res_size=instance.result().length;
        let text="Result "+(res_size==0?0:result_index+1)+"/total "+res_size;
        ctx.fillText(text,acc,y);
        ctx.restore();

        // draw result string
        y+=8;
        const null_res=[null,[],0,""];
        let result=instance.result();
        const tape_num=(canvasElements.type=="multiple")?canvasElements.tape:1;
        if(result.length==0){
            result=null_res;
            if(canvasElements.type=="multiple"){
                result=[null,[],[],""];
                for(let i=0;i<tape_num;i++){
                    result[1].push([]);
                    result[2].push(0);
                }
            }
        }else{
            result=result[result_index];
        }
        for(let p=0;p<tape_num;p++){
            x=acc;
            let paper=(canvasElements.type=="multiple")?result[1][p]:result[1];
            let ptr=(canvasElements.type=="multiple")?result[2][p]:result[2];
            let begin=Math.floor(ptr/18)*18;

            ctx.beginPath();
            ctx.moveTo(acc+2,y);
            ctx.lineTo(acc+2,y-2);
            ctx.lineTo(acc-1,y-2);
            ctx.lineTo(acc-1,y+acc+2);
            ctx.lineTo(acc+2,y+acc+2);
            ctx.closePath();
            ctx.fillStyle="#606266";
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(acc*19-2,y);
            ctx.lineTo(acc*19-2,y-2);
            ctx.lineTo(acc*19+1,y-2);
            ctx.lineTo(acc*19+1,y+acc+2);
            ctx.lineTo(acc*19-2,y+acc+2);
            ctx.closePath();
            ctx.fillStyle="#606266";
            ctx.fill();
            ctx.stroke();
            for(let i=begin;i<begin+18;i+=1){
                ctx.beginPath();
                ctx.moveTo(x,y);
                ctx.lineTo(x+acc,y);
                ctx.lineTo(x+acc,y+acc);
                ctx.lineTo(x,y+acc);
                ctx.closePath();
                ctx.fillStyle="rgb(217,236,255)";
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle="#606266";
                if(i<paper.length)
                    ctx.fillText(paper[i]!=null?paper[i]:' ',x+acc/2,y+acc/2);
                else
                    ctx.fillText(' ',x+acc/2,y+acc/2);
                x+=acc;
            }
            
            // draw arrow which pointing to the place
            // that turing machine is r/w now
            ptr%=18;
            ctx.beginPath();
            ctx.moveTo((1.5+ptr)*acc,y+acc);
            ctx.lineTo((1.7+ptr)*acc,y+1.4*acc);
            ctx.lineTo((1.3+ptr)*acc,y+1.4*acc);
            ctx.closePath();
            ctx.fillStyle="#f56c6c";
            ctx.fill();
            ctx.stroke();
            y+=acc*1.4;
        }
        y-=acc*1.4;

        // draw execution path
        const max_path_show=Math.floor(18*acc/27);
        let tmp=result[3].split(":");
        if(tmp.length==1 && tmp[0].length==0)
            return;
        if(tmp.length>=max_path_show){
            tmp=tmp.slice(tmp.length-max_path_show+1);
            tmp.unshift("...");
        }
        let state_x=1.5*acc;
        const state_y=y+1.4*acc+3+12;
        for(var i=0;i<tmp.length;i++){
            let isfinal=instance.isfinal(tmp[i]);
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle=(isfinal)?"#e1f3d8":"#ffe985";
            ctx.arc(state_x,state_y,12,0,2*Math.PI);
            ctx.fill();
            ctx.stroke();
            if(isfinal){
                ctx.beginPath();
                ctx.arc(state_x,state_y,10,0,2*Math.PI);
                ctx.fill();
                ctx.stroke();
            }
            ctx.fillStyle="#606266";
            let rpx=Math.floor(18/tmp[i].length);
            ctx.font=rpx+"rpx sans-serif"
            ctx.fillText(tmp[i],state_x,state_y);
            ctx.restore();
            state_x+=27;
        }
    },

    /**
     * canvas绘制刷新主函数
     */
    canvasDraw: function() {
        if(ctx==undefined)
            return;
        // background
        ctx.fillStyle="#f2f6fc";
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();
        ctx.moveTo(1,1);
        ctx.lineTo(canvas.width/dpr-1,1);
        ctx.closePath();
        ctx.strokeStyle="#e4e7ed";
        ctx.stroke();

        this.textStyle(); // init text style
        // functions
        ctx.fillStyle="#000000"; // init fill style
        canvasElements.func.forEach(elem =>{
            if(elem.begin_state==null){ // no need to render invalid connection
                return;
            }else{
                let state=this.findState(elem.begin_state);
                elem.begin_x=state.x;
                elem.begin_y=state.y;
            }
            if(elem.end_state!=null){ // end state maybe null, then use end_x end_y
                let state=this.findState(elem.end_state);
                elem.end_x=state.x;
                elem.end_y=state.y;
            }
            if(elem.begin_x==elem.end_x && elem.begin_y==elem.end_y){
                this.drawSelfArrow(elem.begin_x,elem.begin_y,elem.text);
            }else if(elem.isAlone){
                this.drawArrow(elem.begin_x,elem.begin_y,elem.end_x,elem.end_y,elem.text);
            }else{
                this.drawArcArrow(elem.begin_x,elem.begin_y,elem.end_x,elem.end_y,elem.text);
            }
        });
        // states
        canvasElements.state.forEach(elem=>{
            const x=elem.x;
            const y=elem.y;
            this.drawState(elem.name,x,y,15,elem.fillcolor);
            if(elem.isEnd)
                this.drawStateEnd(x,y,11);
            if(elem.isStart)
                this.drawStateStart(x,y,15);
            if(elem.isModule)
                this.drawSubProgram(x,y);
        });
        // simulator paper
        this.drawPaper();
    },

    /**
     * 页面加载时加载文件
     */
    loadExistFile: function(filename) {
        try{
            const res=this.fs.readFileSync(`${wx.env.USER_DATA_PATH}/turingmachinesimulator/`+filename,'utf8',0);
            canvasElements=JSON.parse(res);
        }catch(e){ // empty file
            console.error(e);
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.fs=wx.getFileSystemManager();
        if("type" in options && options.type=="fromedit"){
            let pages=getCurrentPages();
            // do deep copy
            let tmp=JSON.stringify(pages[pages.length-2].data.filedata);
            canvasElements=JSON.parse(tmp);
        }else{
            this.loadExistFile(options.filename);
        }
        wx.setNavigationBarTitle({
            title: "模拟器"
        });
        // initialize turing machine
        if(canvasElements.type=="normal")
            instance=new turing_machine(canvasElements);
        else if(canvasElements.type=="multiple")
            instance=new multi_tape_machine(canvasElements);
        else
            instance=new sub_prog_turing_machine(canvasElements);
        result_index=0;
        // initialize canvas context
        wx.createSelectorQuery()
            .select('#canvas')
            .fields({node:true,size:true})
            .exec((res)=>{
                canvas=res[0].node;
                ctx=canvas.getContext('2d');

                canvas.width=res[0].width*dpr;
                canvas.height=res[0].height*dpr;
                ctx.scale(dpr,dpr);
                // draw exist file's machine structure
                this.canvasDraw();
            });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        try{
            const res=wx.getSystemInfoSync();
            let acc=res.windowWidth/20;
            acc=acc>25?25:acc;
            let paper_height=(canvasElements.type=="multiple")?(canvasElements.tape-1)*acc*1.4:0;
            this.setData({
                height:res.windowHeight,
                width:res.windowWidth,
                acc:acc,
                panel_height:80+paper_height
            });
            this.canvasDraw();
        }catch(e){
            console.error(e);
        }
        // load default simulator panel's y position
        simu_panel_pos=this.data.height*0.62;
        this.canvasDraw();
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            title:"图灵机验证",
            path:"/pages/simulator/simulator"
        }
    },

    touchStart: function (e) {
        const height=this.data.height;
        const panel_height=this.data.panel_height;
        let y=e.touches[0].y-panel_height/2;
        if(simu_panel_pos-panel_height/2<=y && y<=simu_panel_pos+panel_height/2){
            this.setData({panel_selected:true});
        }else{
            return;
        }
        if(y<=0)
            y=0;
        if(y>=height-panel_height-e.target.offsetTop)
            y=height-panel_height-e.target.offsetTop;
        simu_panel_pos=y;
        this.canvasDraw();
    },

    touchMove: function (e) {
        const height=this.data.height;
        const panel_height=this.data.panel_height;
        if(!this.data.panel_selected)
            return;
        let y=e.changedTouches[0].y-panel_height/2;
        if(y<=0)
            y=0;
        if(y>=height-panel_height-e.target.offsetTop)
            y=height-panel_height-e.target.offsetTop;
        simu_panel_pos=y;
        this.canvasDraw();
    },

    touchEnd: function (e) {
        const height=this.data.height;
        const panel_height=this.data.panel_height;
        if(!this.data.panel_selected)
            return;
        let x=e.changedTouches[0].x;
        let y=e.changedTouches[0].y-panel_height/2;
        if(y<=0)
            y=0;
        if(y>=height-panel_height-e.target.offsetTop)
            y=height-panel_height-e.target.offsetTop;
        simu_panel_pos=y;
        this.canvasDraw();
        this.setData({panel_selected:false});
    },

    /**
     *  保存为图片
     */
    savePic: function(e) {
        wx.canvasToTempFilePath({
            canvas:canvas,
            fileType:'png',
            success(res){
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success(res){wx.showToast({title:'保存成功',icon:'success',duration:800});},
                    fail(err){
                        if(err.errMsg=="saveImageToPhotosAlbum:fail auth deny"){
                            wx.navigateTo({url:'/pages/auth/auth?info=无图片保存权限，请设置',});
                        }else{
                            wx.showToast({title:'取消保存',icon:'error',duration:800});
                        }
                    }
                });
            }
        });
    },

    inputString: function() {
        if(instance.isrunning()){
            wx.showToast({
                title: '请中止模拟后再试',
                icon: 'none',
                duration: 800
            });
            return;
        }
        let flush=this.canvasDraw;
        if(canvasElements.type!="multiple"){
            wx.showModal({
                title: "请输入要验证的字符串",
                editable: true,
                success(res){
                    if(res.confirm){
                        instance.setpaper(res.content);
                        if(instance.check()){
                            instance.generate();
                            instance.start();
                        }
                        result_index=0;
                        flush();
                    }else if(res.cancel){
                        instance.stop();
                    }
                }
            });
        }else{
            for(let i=canvasElements.tape;i>0;i--){
                wx.showModal({
                    title: "请输入要验证的字符串 "+i,
                    editable: true,
                    success(res){
                        if(res.confirm){
                            instance.setpaper(res.content,i-1);
                        }else if(res.cancel){
                            instance.setpaper("",i-1);
                        }
                        // input all the strings to start the machine
                        if(i==canvasElements.tape && instance.check()){
                            instance.generate();
                            instance.start();
                        }
                        result_index=0;
                        flush();
                    }
                });
            }
        }
    },

    nextStep: function() {
        if(!instance.isrunning()){
            wx.showToast({
                title: '模拟器未启动，输入待验证字符串以启动模拟器',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        instance.next();
        result_index=0;
        this.canvasDraw();
    },

    terminateSimulation: function() {
        if(!instance.isrunning()){
            wx.showToast({title:'模拟器未启动',icon:'none',duration:800});
            return;
        }
        wx.showToast({title:'运行中止',icon:'none',duration:800});
        instance.stop();
        canvasElements.state.forEach(elem=>{
            elem.fillcolor="#ffe985";
        });
        result_index=0;
        this.canvasDraw();
    },

    fastRun: function() {
        if(!instance.isrunning()){
            wx.showToast({
                title: '模拟器未启动，输入待验证字符串以启动模拟器',
                icon: 'none',
                duration: 1500
            });
            return;
        }
        let count=0;
        while(instance.isrunning()){
            instance.next();
            result_index=0;
            count+=1;
            if(count==200 || instance.accept())
                break;
        }
        if(count==200){
            wx.showToast({title:'执行次数过多,暂停',icon:'none',duration:1500});
        }else if(instance.accept()){
            wx.showToast({title:'有接受状态，暂停',icon:'none',duration:1000});
        }
        this.canvasDraw();
    },

    prevResult: function() {
        let size=result_index-1;
        if(size<0){
            size=instance.result().length-1;
        }
        result_index=size;
        this.canvasDraw();
    },

    nextResult: function() {
        let size=result_index+1;
        if(size>=instance.result().length){
            size=0;
        }
        result_index=size;
        this.canvasDraw();
    }
})