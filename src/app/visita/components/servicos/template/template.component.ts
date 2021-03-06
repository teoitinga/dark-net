import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Observer } from 'rxjs';
import { AuthenticationService } from 'src/app/authentication/authentication.service';
import { ServicosPrestadosModel } from 'src/app/shared/models/servicos-prestados.model';
import { TecnicoModel } from 'src/app/shared/models/tecnico.model';
import { MessageService } from 'src/app/shared/service/responses-messages.service';
import { SearchMunicipioService } from 'src/app/shared/service/search-municipio.service';
import { CpfValidator } from 'src/app/shared/validators/cpf-validator';
import { Chamada, Produtore, VisitaPostModel } from 'src/app/visita/models/visita-post.model';
import { VisitaService } from 'src/app/visita/services/visita.service';

@Component({
  selector: 'services-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.css']
})
export class TemplateComponent implements OnInit {

  @Input() SITUACAO_TEXT: string;
  @Input() ORIENTACAO_TEXT: string;
  @Input() RECOMENDACAO_TEXT: string;
  @Input() TEMPLATE_TITLE: string;
  @Input() TEMPLATE_SUB: string;
  @Input() chamadas: Chamada[];
  @Input() CRIAR_PASTA: boolean = true;

  @Output() removed = new EventEmitter();

  produtores: Produtore[] = [];
  produtor: Produtore;

  chamada: Chamada;

  //municipios: string[] = [];
  municipios$ = new Observable<string>();

  servico: ServicosPrestadosModel;

  visita: VisitaPostModel;

  loading: boolean = false;

  //Forms Utilizados no registro
  produtoresForm: FormGroup;
  servicosForm: FormGroup;
  visitaForm: FormGroup;
  tecnicoResponsavel: TecnicoModel;
  usuario: string;
  municipioTecnico: any;

  //FIELDS of form
  FIELD_NAME_PRODUTOR: string = 'nome';

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private municipioService: SearchMunicipioService,
    private visitaService: VisitaService,
    private messageService: MessageService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {
    this.loadMunicipios();
  }


  ngOnInit(): void {

    //Carrega usuario logado
    this.usuario = this.authService.getUserName();
    
    //Carrega municipio do tecnico
    this.municipioTecnico = this.authService.getMunicipioDoTecnico();

    //Carrega o formulário de produtores
    this.produtorLoadForm();
    //Carrega o formulário de visita
    this.visitaLoadForm();
  }
  hasProdutores():boolean{

    if(this.produtores.length>0){
      return true;
    }else{
      return !true;
    }
    
  }

  private produtorLoadForm() {
    this.produtoresForm = this.fb.group({
      cpf: ['', [Validators.required, CpfValidator]],
      nome: [{value: '', disabled: true}, [Validators.required, Validators.minLength(6)]]
    });
  }

  loadMunicipios() {
    this.municipios$ = this.municipioService.getMunicipios();
  }

  private visitaLoadForm() {
    this.visitaForm = new FormGroup({
      localDoAtendimeno: new FormControl('', [Validators.required, Validators.minLength(6)]),
      dataDaVisita: new FormControl('', [Validators.required]),
      municipio: new FormControl(this.municipioTecnico, [Validators.required])
    });
  }

  incluirProdutor(event) {
    event.preventDefault();

    const prd: Produtore = this.produtoresForm.value;

    //verifica se existe o produtor na lista
    const containing = this.produtores.find(pr=>pr.cpf == prd.cpf);

    if (!containing) {

      this.produtores.push(prd);
      this.clearFormProdutor();

    } else {
      this.messageService.sendError(this._snackBar, "Erro", "Este beneficiário já é atendido!");
    }

  }
  verificarNomeProdutor(value: any){

    const prd: Produtore = this.produtoresForm.value;
    try{
      
      prd.nome = prd.nome.replace(/[^a-zA-Z -]/g, "");
      //Remove espaços ni inicio ou final do nome
      prd.nome = prd.nome.trim();
      this.produtoresForm[this.FIELD_NAME_PRODUTOR] = prd.nome;

    }catch{
      
    }

  }

  removerProdutor(value, event) {
    event.preventDefault();
    this.produtores = this.produtores.filter(item => item !== value);

    //emitindo notificação para atualização de serviço
    this.removed.emit(this.produtores)

  }
  private clearFormProdutor() {
    this.produtoresForm.controls['nome'].disable();
    this.produtoresForm.controls['nome'].setValue('');
    this.produtoresForm.controls['cpf'].setValue('');
  }
  verificarProdutor(value: any) {
    this.loading = true;

    const cpf: string = value.target.value.replace(/\.|\-/g, '');
    
    let nomeProdutor: string = '';
    
    this.visitaService.obterProdutor(cpf).subscribe(
      data => {
        if(data!=null){
          nomeProdutor = data['nome'];
          this.produtoresForm.controls['nome'].disable();
          this.produtoresForm.controls['nome'].setValue(nomeProdutor);
  
          this.produtor = this.produtoresForm.value;
  
          this.produtor.nome = this.produtoresForm.controls['nome'].value;
          this.loading = !true;
        }else{
          this.habilitaInfoNome()
          this.loading = !true;
        }
      },
      error => {
      }
    );

  }
  habilitaInfoNome() {
    this.produtoresForm.controls['nome'].enable();
    this.produtoresForm.controls['nome'].setValue('');
    this.produtoresForm.controls['nome'].setValidators([Validators.required, Validators.minLength(6)]);
  }
  registrarServico(event) {
    //Configura a chamada
    const component = this;
    event.preventDefault();

    if (!(this.produtores.length > 0)) {
      this.messageService.sendError(this._snackBar, "Erro", "Deve haver pelo menos um beneficiário!");
      return;
    }

    //Configurando visita com os dados do form

    this.visita = this.visitaForm.value;
    this.visita.situacaoAtual = this.SITUACAO_TEXT;
    this.visita.orientacao = this.ORIENTACAO_TEXT;
    this.visita.recomendacao = this.RECOMENDACAO_TEXT;
    this.visita.chamadas = this.chamadas;
    this.visita.produtores = this.produtores;
    this.visita.createFolder = this.CRIAR_PASTA;

    this.visitaService.sendVisita(this.visita).subscribe(
      data => {
        this.router.navigate(['login/home']);
        this.messageService.sendInfoMessage(this._snackBar, "Sucesso!", "O Atendimento foi registrado com sucesso")
      },
      error => {
        console.error("Intercept error: " + error);
        this.messageService.sendError(this._snackBar, "Erro", "Erro na requisição!");
      }
    );
  }
}


