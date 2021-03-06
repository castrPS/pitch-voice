import React from 'react';
import dicionarie from './WordGiver.js';
import ScreenStart from './ScreenStart';
import ScreenResults from './ScreenResults';
import ScreenSing from './ScreenSing';
import ScreenStartLoop from './ScreenStartLoop';
import {ScreenOrientation} from 'expo';
import {Alert} from 'react-native';

export default class MainScreen extends React.Component{ //classe que da tela do jogo! todas outras telas do jogo são chamadas aqui!
    
    constructor(props){
        super(props);

        /*
        variaveis vindas da tela PreGame
        -> textInput: array com o nome dos jogadores
        -> topScore: pontuação máxima
        -> timeSing: tempo para cantar
        -> showtime: tempo do jogo
         */
        const { navigation } = this.props;
        const topScore = navigation.getParam('topScore');
        const timeSing = navigation.getParam('timeSing');
        const showtime = navigation.getParam('showtime');
        const stringColor = navigation.getParam('stringColor');
        const numPlayers = navigation.getParam('numPlayers');
        const stringRGBAColor = navigation.getParam('stringRGBAColor');
        const stringColorOpacity = navigation.getParam('stringColorOpacity');

        this.state = {
            gameOver:false, //flag antiga, a qual dizia se o jogador atingiu os pontos necessarios pra acabar o jogo
            winOrlose: false, // variavel para saber se o jogador ganhou ou não os pontos do round!
            timesUpVote:false, // flag para trocar de tela! 
            pontuacaoParcial:[0,0,0,0,0,0], //array que tem os pontos de cada round de cada jogador, por exemplo: [10,9,0,8,7,0].
            numPlayers:numPlayers, // quantidade de jogadores
            howManyWon: 0, // variavel que diz quantos jogadores ja ganharam pontos naquele round
            arrayVote: [1,1,1,1,1,1], //array dos votos
            arrayTotalScore: [0,0,0,0,0,0], // array com pontuação total
           /*  winner: 30, */
            howManySinged:0,
            winner: JSON.stringify(topScore), // variavel que diz qtos pontos acaba o jogo
            pontuacaoMax: 10, // qtd max de pontos por round
            penalidade: 1, // o qto vai subtrair por acerto em cada round
            whoPressButton:0, // variavel pra saber o indice do array certo, diz quem apertou o botão pra cantar.
            stringColor: stringColor, //array com as cores 
            stringRGBAColor: stringRGBAColor, //array com as cores em rgba
            stringColorOpacity:stringColorOpacity,  //COR DO ICONE DO CENTRO DE musica
            arrayBoolean:[false,false,false,false,false,false], //array auxiliar que serve para desabilitar um jogador que ja cantou e serve tbm para mostrar quem vai cantar
            word:'TIMER',  // estado que é palavra do jogo
            holdFlag: false,  // flag para trocar de tela.
            timesUp:false, // flag para trocar de tela.
            timer: null,   // a funcao relogio.
            /* timeInitial:30, */
            timeInitial: (JSON.stringify(showtime)*2), // isso aqui é o tempo que foi definido para os rounds
            time:(JSON.stringify(showtime)*2), // variavel tempo que fica com o tempo atual
            /* timeToSing:15, */
            timeToSing: JSON.stringify(timeSing), // tempo definido para uma pessoa poder cantar.
            timeToVote:10, // tempo definido para ocorrer a votação
            timeAux:0,   // variavel que guarda o tempo pausado, para qdo voltar, saber em qtos segundos estava
            seconds: 0, // variavel q mostra os segundos no momento
            isRunningTime: false, // diz se algum relogio esta rodando ou se esta parado
            votes: 0,
        } 

        
    }
      // função que roda qdo a tela principal é chamada, atualiza o nome que vai ser sorteado.
    componentDidMount(){ 
        this.changeScreenOrientation();
        let word = dicionarie.giveWord();
        this.setState({
            word:word,
        })
    }
    changeScreenOrientation() {
        ScreenOrientation.allow(ScreenOrientation.Orientation.LANDSCAPE);
      }

    // função que é chamada qdo você vai para tela de resultados. Aqui você descobre se volta para a ScreenStart ou Se o jogo acabou.
    BackToStart= (index) =>{  
        let arrayTotalScore = this.state.arrayTotalScore;
        let winner = this.state.winner;

        
        if(arrayTotalScore[index]<winner){
            if(this.state.howManySinged==this.state.numPlayers){ 
                this.AllPlayersHaveSinged();
            }else{
            this.setState({
                timesUp:false,
                holdFlag:false,
                timesUpVote:false,
                winOrlose:false,
                arrayVote:[1,1,1,1,1,1],
            });
            
            }
        }else{
            this.GameOver();
        }
    }
    // função que é chamada qdo alguém aperta o botão pra cantar
    StartSing = (i) => {
        
        
        if(this.state.isRunningTime){
            let arrayBoolean = this.state.arrayBoolean;
            arrayBoolean[i] = true;
            let timer = clearInterval(this.state.timer);
            this.setState({
                howManySinged:this.state.howManySinged + 1,
                whoPressButton:i,            
                arrayBoolean:arrayBoolean,
                timeAux:this.state.seconds,
                time:this.state.timeToSing,
                isRunningTime:false,
                seconds:0,
                timesUp:false,
                timer:timer,
                isRunningTime:false,
                holdFlag:true, // muda a tela
            });
        }      
       else {
           
        }
        
    }  

    ExitGame=()=>{
        if(this.state.isRunningTime){
            this.StopTimer();
            Alert.alert(
                'Sair do Jogo',
                'Você deseja sair do jogo? É um processo sem volta!',
                [
                {text: 'Sim', onPress: () => this.props.navigation.navigate('Intro')},
                {text: 'Não', onPress: () => this.PlayTimer(), style: 'cancel'},
                ],
                { cancelable: false }
            )
        }
    }

    //função que é chamada qdo alguém vota positivo!
    VoteLike=(index)=>{
        
        let arrayVote = this.state.arrayVote;
            arrayVote[index] = 1;
            this.setState({
               arrayVote:arrayVote,
            });
                
    }
 //função que é chamada qdo alguém vota negativo!
    VoteDislike=(index)=>{
        let arrayVote = this.state.arrayVote;
            arrayVote[index] = -1;
            this.setState({
               arrayVote:arrayVote,
            });
    }

    // função que calcula os votos
    computaVotos= () =>{
        let howManyWon = this.state.howManyWon;
        let pontuacaoMax = this.state.pontuacaoMax;
        let penalidade = this.state.penalidade;
        let votes=0;      
        let arrayVote = this.state.arrayVote;
        for(let i in arrayVote){ 
             votes += arrayVote[i]; // soma os votos que estão no array
            }
            votes = votes -7+this.state.numPlayers; // -7 pq precisa tirar -1 (quem canta n vota) e -6 pra compensar a qtd de jogadores.
        let arrayTotalScore = this.state.arrayTotalScore;
        let index = this.state.whoPressButton;
        let pontuacaoAtual = pontuacaoMax-(howManyWon*penalidade);
        let pontuacaoParcial = this.state.pontuacaoParcial;

        if(votes>0){ // se ganhar pontos
            pontuacaoParcial[index] = pontuacaoAtual;
            arrayTotalScore[index] = pontuacaoAtual+arrayTotalScore[index];

            this.setState({
                votes:votes,
                howManyWon:howManyWon+1,
                pontuacaoParcial:pontuacaoParcial, 
                winOrlose:true,
                arrayTotalScore:arrayTotalScore,
                arrayVote: [1,1,1,1,1,1],
            });

        }else if(votes==0){ // se for neutro é random! 50% de chance
            let lucky = (Math.random()*100);
            if(lucky%2<1){
                pontuacaoParcial[index] = pontuacaoAtual;
                arrayTotalScore[index] = pontuacaoAtual+arrayTotalScore[index];
    
                this.setState({
                    votes:votes,
                    howManyWon:howManyWon+1,
                    pontuacaoParcial:pontuacaoParcial,
                    winOrlose:true,
                    arrayTotalScore:arrayTotalScore,
                    arrayVote: [1,1,1,1,1,1],
                });
            }else{
                this.setState({ //perdeu
                    votes:votes,
                    winOrlose:false,
                    arrayVote: [1,1,1,1,1,1],
                })
            }

        }else{ // perdeu 
            this.setState({
                votes:votes,
                winOrlose:false,
                arrayVote: [1,1,1,1,1,1],
            })
        }
    }

  //pausa o tempo  
    StopTimer=()=>{
        if(this.state.isRunningTime){
        let timer = clearInterval(this.state.timer);
        this.setState({
            isRunningTime:false,
            timer:timer
        })
        }
    }

    PlayTimer=()=>{
        if(!this.state.isRunningTime){
            if(!this.state.timesUp){
                this.CountDownTimer();
            }else{
                this.CountDownTimerLoop();
            }
        }else{
            Alert.alert("Error! Reinicie o APP")
        }
    }
 // reseta o relogio
    Reset=()=>{
        if(this.state.isRunningTime){
            let timer = clearInterval(this.state.timer);
        this.setState({
            isRunningTime:false,
            seconds:0,
            timer: timer,
        })}else{
            
        }
       
    }

 // volta para a tela principal pois a pessoa desistiu
    DesistirSing=()=>{

        if(this.state.isRunningTime){
            let timer = clearInterval(this.state.timer)
            this.setState({                
                timer: timer,                        
                timesUp:false,
                time:this.state.timeInitial,
                seconds:this.state.timeAux,
                holdFlag:false,
                isRunningTime:false, /*correção de um bug q ao clicar rapidamente logo apos 
                                    alguem cantar, tinha q esperar 1 segundo pra essa variavel atualizar*/

            });
        }
        if(this.state.howManySinged==this.state.numPlayers){ 
            this.AllPlayersHaveSinged();
        }
    }
 // avança logo para a tela de votação
    Done=()=>{
        if(this.state.isRunningTime){
        let timerClear = clearInterval(this.state.timer)
        this.setState({
            isRunningTime:false,
            timer:timerClear,
            timesUp:true,
            time:this.state.timeInitial,
            seconds:this.state.timeAux,              
            holdFlag:true, 
            timesUpVote:true,
            
        });
        }else{

        }
    }
 //timer so para a parte da tela de cantar
    CountDownTimerSing=()=>{
        let timer =  setInterval( () => {this.setState(
            previousState=>{
             if(this.state.seconds<this.state.time){
                 return {seconds: this.state.seconds +1,isRunningTime:true,timer:timer};
             }else{ //lembrar de dar clear no interval   (done)      
                 let timerClear = clearInterval(timer);  
                 return {
                    isRunningTime:false,
                    timer:timerClear,
                    timesUp:true,
                    time:this.state.timeInitial,
                    seconds:this.state.timeAux,              
                    
                    holdFlag:true, 
                    timesUpVote:true, 
                 }
             }           
            })
         },1000);
        
         
    }

 // timer da tela ScreenStartLoop pois é igual da Screen start mas muda 1 flag que fica tabelando entre ScreenStart e ScreenStartLoop
    CountDownTimerLoop=()=>{
        if(this.state.timesUp==true){        
            let timer =  setInterval( () => {this.setState(
                previousState=>{
               if(this.state.seconds<this.state.time){
                   return {
                       seconds: this.state.seconds +1,
                       isRunningTime:true,
                       timer:timer,
                       };
               }else{     
                   let timerClear = clearInterval(timer);  
                   let word = dicionarie.giveWord();
                   return {
                       isRunningTime:false,
                       timer:timerClear,
                        seconds:0,                      
                       arrayBoolean:[false,false,false,false,false,false],                       
                      word:word,
                       holdFlag: false,
                       timesUp:false,               
                       time:this.state.timeInitial,                       
                       arrayVote:[1,1,1,1,1,1],
                       pontuacaoParcial:[0,0,0,0,0,0],
                       howManyWon:0,
                       howManySinged:0,
                        }
                    }           
                })
            },500); 
        }   
    }
 // timer da tela principal
    CountDownTimer=()=>{
          if(this.state.timesUp==false){        
            let timer =  setInterval( () => {this.setState(
                previousState=>{
               if(this.state.seconds<this.state.time){
                   return {
                       seconds: this.state.seconds +1,
                       isRunningTime:true,
                       timer:timer, 
                   }                     
               }else{ //lembrar de dar clear no interval   (done)      
                   let timerClear = clearInterval(timer); 
                   let word = dicionarie.giveWord(); 
                   return {
                       word:word,
                       seconds:0,
                       isRunningTime:false,
                       timer:timerClear,
                       arrayBoolean:[false,false,false,false,false,false],                       
                       holdFlag: false, // mantem falso
                       timesUp:true,      // vai para a tela de ScreenStartLoop para poder ficar tabelando entre telas principais (para o jogador parece que só existe 1 tela)        
                       time:this.state.timeInitial,                       
                       arrayVote:[1,1,1,1,1,1],
                       pontuacaoParcial:[0,0,0,0,0,0],
                       howManyWon:0,
                       howManySinged:0,
                        }
                    }           
                   })
                },500);   
            }            
            
        
    }

  // pula a musica! isso faz com que tabele entre ScreenStartLoop e ScreenStart, para poder ficar mudando de palavra e resetando as coisas necessárias (como relogio e etc)
    Skip=()=>{
    if(this.state.isRunningTime){ 
        let word = dicionarie.giveWord();   
        if(this.state.timesUp==false){
        this.Reset();
        this.setState({
                    word:word,
                    arrayBoolean:[false,false,false,false,false,false],                       
                    holdFlag: false,
                    timesUp:true,               
                    time:this.state.timeInitial,                       
                    arrayVote:[1,1,1,1,1,1],
                    pontuacaoParcial:[0,0,0,0,0,0],
                    howManyWon:0,
                    howManySinged:0,
        });
        }else{
            this.Reset();
            this.setState({
                word:word,
                arrayBoolean:[false,false,false,false,false,false],                       
                holdFlag: false,
                timesUp:false,               
                time:this.state.timeInitial,                       
                arrayVote:[1,1,1,1,1,1],
                pontuacaoParcial:[0,0,0,0,0,0],
                howManyWon:0,
                howManySinged:0,
                
            });
        }
    }
        
}

AllPlayersHaveSinged=()=>{ //todos jogadores cantaram (mas time is not running por isos mais uma função)

    let word = dicionarie.giveWord();   
    if(this.state.timesUp==false){
        this.Reset();
        this.setState({
                    word:word,
                    arrayBoolean:[false,false,false,false,false,false],                       
                    holdFlag: false,
                    timesUp:true,               
                    time:this.state.timeInitial,                       
                    arrayVote:[1,1,1,1,1,1],
                    pontuacaoParcial:[0,0,0,0,0,0],
                    howManyWon:0,
                    howManySinged:0,
                    seconds:0,
                    time: this.state.timeInitial
        });
        }else{
            this.Reset();
            this.setState({
                word:word,
                arrayBoolean:[false,false,false,false,false,false],                       
                holdFlag: false,
                timesUp:false,               
                time:this.state.timeInitial,                       
                arrayVote:[1,1,1,1,1,1],
                pontuacaoParcial:[0,0,0,0,0,0],
                howManyWon:0,
                howManySinged:0,
                seconds:0,
                time: this.state.timeInitial
                
            });
        }
}


   // funçao que acaba o jogo! aqui passa os parametros para a tela de ranking por navegação
    GameOver=()=>{
        const { navigation } = this.props;
        let arrayTotalScore = [];
        let numPlayers = this.state.numPlayers;
        if(numPlayers==6){
            arrayTotalScore = this.state.arrayTotalScore;
        }else if(numPlayers==5){
            arrayTotalScore[0] = this.state.arrayTotalScore[0];
            arrayTotalScore[1] = this.state.arrayTotalScore[1];
            arrayTotalScore[2] = this.state.arrayTotalScore[2];
            arrayTotalScore[3] = this.state.arrayTotalScore[3];
            arrayTotalScore[4] = this.state.arrayTotalScore[5];
        }else if(numPlayers==4){
            arrayTotalScore[0] = this.state.arrayTotalScore[0];
            arrayTotalScore[1] = this.state.arrayTotalScore[2];
            arrayTotalScore[2] = this.state.arrayTotalScore[3];
            arrayTotalScore[3] = this.state.arrayTotalScore[5];
        }else if(numPlayers==3){
            arrayTotalScore[0] = this.state.arrayTotalScore[1];
            arrayTotalScore[1] = this.state.arrayTotalScore[3];
            arrayTotalScore[2] = this.state.arrayTotalScore[5];
        }else if(numPlayers==2){
            arrayTotalScore[0] = this.state.arrayTotalScore[1];
            arrayTotalScore[1] = this.state.arrayTotalScore[4];
        }
        


        const names = navigation.getParam('names');
        navigation.navigate('Ranking', {
            arrayTotalScore: arrayTotalScore,
            names:names,
            stringColor: navigation.getParam('stringColorSorted'),
            numPlayers: numPlayers,
        });
    }


    render(){
        // isso aqui é só pra ficar melhor de chamar nos parametros e diminuir espaço
        // sempre que for passar um estado para as telas, coloque seu let aqui ou use os que estão aqui
        const ratio = 100/this.state.time;
        let circleProgress = this.state.seconds*ratio;
        let word = this.state.word;
        let stopTimer = this.StopTimer;
        let voteLike= this.VoteLike;
        let voteDislike = this.VoteDislike;
        let countDownTimer = this.CountDownTimer;
        let reset = this.Reset;
        let startSing = this.StartSing;
        let timesUp =this.state.timesUp;
        let countDownTimerSing = this.CountDownTimerSing;
        let desistirSing = this.DesistirSing;
        let holdFlag = this.state.holdFlag;
        let arrayBoolean = this.state.arrayBoolean;        
        let boolean1= arrayBoolean[0];
        let boolean2= arrayBoolean[1];
        let boolean3= arrayBoolean[2];
        let boolean4= arrayBoolean[3];
        let boolean5= arrayBoolean[4];
        let boolean6= arrayBoolean[5];
        let timer = this.state.timer;
        let skip = this.Skip;
        let countDownTimerLoop = this.CountDownTimerLoop;
        let done = this.Done;
        let whoPressButton = this.state.whoPressButton;
        let stringColor = this.state.stringColor;
        let stringRGBAColor = this.state.stringRGBAColor;
        let stringColorOpacity = this.state.stringColorOpacity;
        let arrayTotalScore = this.state.arrayTotalScore;
        let arrayVote = this.state.arrayVote;
        let pontuacaoParcial = this.state.pontuacaoParcial;
        let timesUpVote = this.state.timesUpVote;
        let winOrlose = this.state.winOrlose;
        let votes = this.state.votes;
        let numPlayers = this.state.numPlayers;
        let ExitGame = this.ExitGame;

        //lembrem-se se passar os parametros que quiserem como PROPS como está aqui embaixo
                        
                //aqui é a flag que controla se alguém apertou o botão de cantar ou não
                if(holdFlag==false){
                    if(timesUp==false){ 
                        return(  //inicio, tela principal!
                        <ScreenStart ExitGame={ExitGame} seconds={this.state.seconds} numPlayers={numPlayers} stringRGBAColor={stringRGBAColor} stringColor={stringColor} arrayTotalScore={arrayTotalScore} skip={skip} timer={timer} zerar={this.Zerar} boolean6={boolean6} boolean5={boolean5} boolean4={boolean4} boolean3={boolean3} boolean2={boolean2} boolean1={boolean1} startSing={startSing} reset={reset} countDownTimer={countDownTimer} circleProgress={circleProgress} stopTimer={stopTimer} word={word} />
                    ); // se o tempo acabar (ou vc der skip) vai tabelar para ScreenStartLoop
                    }else{ 
                        
                        return( // também é a tela principal, porém aqui seria o Loop da tela, para existir varios rounds. (Tive problemas com o relogio para ter só uma tela que entraria em loop, preferi criar outra tela igual)
                        <ScreenStartLoop ExitGame={ExitGame} seconds={this.state.seconds} numPlayers={numPlayers} stringRGBAColor={stringRGBAColor} stringColor={stringColor} arrayTotalScore={arrayTotalScore} skip={skip} timer={timer} zerar={this.Zerar} boolean6={boolean6} boolean5={boolean5} boolean4={boolean4} boolean3={boolean3} boolean2={boolean2} boolean1={boolean1} startSing={startSing} reset={reset} countDownTimerLoop={countDownTimerLoop} circleProgress={circleProgress} stopTimer={stopTimer} word={word}  />
                        );// se o tempo acabar (ou vc der skip) vai tabelar para ScreenStart
                    }
                }else{ // apertaram o botão então vai para a tela de cantar primeiro
                    if(timesUp==false) { //galera esta cantando aqui
                        return(
                            <ScreenSing numPlayers={numPlayers} arrayVote={arrayVote} voteLike={voteLike} voteDislike={voteDislike} stringColorOpacity={stringColorOpacity} stringRGBAColor={stringRGBAColor} stringColor={stringColor}  whoPressButton={whoPressButton} done={done} desistirSing={desistirSing} countDownTimerSing={countDownTimerSing} circleProgress={circleProgress}  word={word} />
                        );
                    } else{  // terminou de cantar ou acabou o tempo
                        if(timesUpVote==false){ // hora de votar
                        return(
                            <Text>//antes era screenVote
                            </Text>
                        );}else{  // acabou tempo de votação e mostra tela de resultado da votação.
                            return(
                                <ScreenResults numPlayers={numPlayers} votes={votes} stringColor={stringColor} winOrlose={winOrlose} backToStart={this.BackToStart} computaVotos={this.computaVotos} arrayVote={arrayVote} pontuacaoParcial={pontuacaoParcial} whoPressButton={whoPressButton} />
                            );
                        }

                    }       
                    
                    
                    
                }
            
    }
}


