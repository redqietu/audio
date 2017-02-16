;(function($,window,Drag,Audio,tool){
    var ui = new Ui();

    function Ui(){
        var player=$('.js-player');
        
        //播放音频
        var audio=new Audio({},{
            'src':newsVoiceData,
            'start':'.e-time--left',
            'end':'.e-time--right',
            'tip':'.t-tip',
            'play':'../images/icon-play.png',
            'pause':'../images/icon-pause.png',
            'btn':'.js-player .e-play',
            'onProgress':function(){
                var all=player.find('.e-all');
                var loaded=player.find('.e-loaded');
                var width=parseInt(all.css('width'));
                return function(e){
                    loaded.css({
                        width:e * width+'px'
                    });
                }
            }(),
            'onPlaying':function(){
                var left=player.find('.e-left');
                var drag=player.find('.e-drag');
                var width=parseInt($('.js-player .w-progress').css('width'));
                return function(){
                    if(progress.dragging)return;
                    var duration=audio.audio.duration;
                    var time=audio.audio.currentTime;
                    var start=tool.parseTime(time);
                    var rest=tool.parseTime(duration-time);
                    audio.setBegin(start);
                    audio.setRest(rest);
                    var pers=time/duration;
                    
                    drag.css({
                        left:width*pers+'px',
                    });
                    left.css({
                        width:width*pers+'px',
                    });
                }
            }(),
        });
        //进度条
        var progress=new Drag({
            target:$('.w-progress .e-drag').get(0),
            onStart:function(){},
            onMove:function(){
                var left= $('.w-progress .e-left');
                return function(vector,newPos,pers){
                    left.css('width',newPos+'px');
                }
            }(),
            onEnd:function(){
                return function(pers){
                    if(!audio.audio||!audio.audio.duration)return;
                    var now =pers*audio.audio.duration;
                    audio.setProgress(now);
                    audio.setBegin(tool.parseTime(now));
                    audio.setRest(tool.parseTime((1-pers)*audio.audio.duration));
                }
            }(),
            width:3.5
        });

        //音量条
        var volume=new Drag({
            target:$('.e-volume .e-dot').get(0),
            onStart:function(){},
            onMove:function(){
                var left= $('.e-volume .e-left--v');
                return function(vector,newPos,pers){
                    left.css('width',newPos+'px');
                    audio.setVolume(pers);
                }
            }(),
            onEnd:function(){},
            width:2
        });

        
        
        var eventState=bindEvent(player,audio);

        function bindEvent(player,audio){
            var expand=player.find('.js-expand');
            var shrink=player.find('.js-shrink');
            var btn=player.find('.e-play');

            expand.on('click',function(){
                player.removeClass('quiet').addClass('active');
            });
            shrink.on('click',function(){
                player.removeClass('active').addClass('quiet');
            });
            btn.on('click',function(){
                audio.init();
                var status=audio.toggle();
                if(status==0){
                    btn.css({
                        backgroundImage:'url(../images/icon-pause.png)'
                    });
                    audio.tip.html('Loading!');
                }else{
                    btn.css({
                        backgroundImage:'url(../images/icon-play.png)'
                    });
                }
            });
            return 0;
        } 
    }
})(
    $,
    window,
    function Drag(){
        var has=Object.prototype.hasOwnProperty;
        function Drag(config){
            this.target=config.target;
            this.wrapper=$(this.target).parent();
            var target=this.target;
            this.initialStyles={};
            this.left=0;
            this.limit=parseInt($(this.wrapper).css('width'));
            var that=this;
            this.onMove=config.onMove;
            this.onEnd=config.onEnd;
            this.onStart=onStart;
            target.onmousedown=function(e){
                onStart(that,e);
            };
            this.width=config.width;
            this.pers=0;
            this.dragging=false;

        }
        function mousePos(e){ 
            var x,y; 
            var e = e||window.event; 
            return { 
                x:e.pageX||e.clientX, 
                y:e.pageY||e.clientY
            } 
         }
                    
        function getStyles(dom){
            if(window.getComputedStyle){
                return window.getComputedStyle(dom,null)
            }else{
                return dom.currentStyle;
            }
        }

        function onStart(dragable,e){
            dragable.dragging=true;
            var originalStyles=getStyles(dragable.target);
            dragable.initialStyles.left=parseInt(originalStyles.left)||0;
            dragable.left=mousePos(e).x;
            dragable.flag=true;
            document.onmousemove=onMove;
            document.onmouseup=onEnd;

            function onMove(e){
                var now=mousePos(e).x;
                var vx=mousePos(e).x-dragable.left;
                var newLeft=dragable.initialStyles.left+vx;
                if(newLeft>dragable.limit-dragable.width){
                    newLeft=dragable.limit-dragable.width;
                }
                if(newLeft<0){
                    newLeft=0;
                }
                dragable.target.style.left=newLeft+'px';
                dragable.onMove&&dragable.onMove(vx,newLeft,newLeft/dragable.limit);
                dragable.pers=newLeft/dragable.limit;
                // console.log(dragable.pers);
                
                return false ;
            }

            function onEnd(e){
                document.onmousemove=null;
                document.onmouseup=null;
                dragable.onEnd&&dragable.onEnd(dragable.pers);
                dragable.dragging=false;

                return false;
            }
        }

        return Drag;

        
    }(),
    function Audio(){
        function Audio(native,ui){
            this.inited=false;
            this._native=native;
            this._ui=ui;
        }

        Audio.prototype={
            constructor:Audio,
            play:function(){
                this.audio.play();
                return 0;
            },
            pause:function(){
                this.audio.pause();
                return -1;
            },
            toggle:function(){
                return this.audio.paused?this.play():this.pause();
            },
            setVolume:function(v){
                this.audio.volume=v;
            },
            setProgress:function(time){
                if(time!=time)return;
                try{
                    this.audio.currentTime=time;
                }catch(e){

                }
            },
            setBegin:function(e){
                $(this._ui.start).html('-'+e);
            },
            setRest:function(e){
                $(this._ui.end).html('-'+e);
            },
            init:function(){
                if(this.inited)return;
                this.inited=true;
                var native=this._native;
                var ui=this._ui;
                this.audio=document.createElement('audio');
                var html='';
                for(var i in this._ui.src){
                    if(this._ui.src.hasOwnProperty(i)){
                        html+='<source src="'+this._ui.src[i]+'" type="audio/'+i+'" />';
                    }
                }
                if(navigator.userAgent.indexOf("MSIE 9.0")>0){
                    this.audio.src='../media/3.mp3';
                }else{
                    this.audio.innerHTML=html;
                }
                
                window.audio=this.audio;
                this.duration=0;
                for(var i in native){
                    this.audio[i]=native[i];
                }
                var that=this;
                this.audio.onloadedmetadata=function(e){
                    var audio=e.path[0];
                    that.duration=audio.duration/100;
                    var end='-0'+that.duration.toFixed(2);
                    $(ui.end).html(parseTime(this.duration));
                }
                this.audio.ontimeupdate=function(e){
                    that._ui.onPlaying();
                }
                this.audio.onwaiting=function(e){
                    if(this.error){
                        that.tip.html('网络错误!');
                        return;
                    }
                    // that.tip.html('Loading!');
                }
                this.audio.onended=function(){
                    var btn=$(that._ui.btn);
                    btn.css({
                        backgroundImage:'url('+that._ui.play+')'
                    });
                }
                this.audio.onprogress=function(e){
                    var audio=e.path[0];
                    var rangs=audio.buffered;
                    // console.log(rangs)
                    if(rangs.length==0)return;
                    var time=rangs.end(rangs.length-1);
                    var pers=time/audio.duration;
                    // console.log(pers)
                    that._ui.onProgress(pers);
                }
                this.audio.onplaying=function(){
                    that.tip.html('');
                }
                this.audio.onerror=function(){
                    that.tip.html('网络错误!');
                }
                this.audio.onstalled=function(){
                    that.tip.html('网络错误!');
                }
                this.audio.onabort=function(){
                    that.tip.html('网络错误！');
                }
                this.tip=$(ui.tip);
                function parseTime(s){
                    s=parseInt(s);
                    var min=parseInt(s/60);
                    var sec=s%60;
                    min=min||0;
                    sec=sec||0;
                    if(sec<=9){
                        sec='0'+sec;
                        // if(sec==1){
                        //     sec='00'
                        // }
                    }
                    return '0'+min+':'+sec;
                }
                
            }
        }

        return Audio;
    }(),
    {
        parseTime:function parseTime(s){
            s=parseInt(s);
            var min=parseInt(s/60);
            var sec=s%60;
            min=min||0;
            sec=sec||0;
            if(sec<=9){
                sec='0'+sec;
                // if(sec==1){
                //     sec='00'
                // }
            }
            return '0'+min+':'+sec;
        },
    }
);