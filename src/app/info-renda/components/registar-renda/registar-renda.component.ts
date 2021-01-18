import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';

import { CpfValidator } from './../../../shared/validators/cpf-validator';
import { MessageService } from 'src/app/shared/service/responses-messages.service';

import { VisitaService } from 'src/app/visita/services/visita.service';
import { ServicosPrestadosModel } from 'src/app/shared/models/servicos-prestados.model';
import { SearchMunicipioService } from 'src/app/shared/service/search-municipio.service';
import { TecnicoModel } from 'src/app/shared/models/tecnico.model';
import { Chamada, Produtore, VisitaPostModel } from './../../../visita/models/visita-post.model';

@Component({
  selector: 'app-registar-renda',
  templateUrl: './registar-renda.component.html',
  styleUrls: ['./registar-renda.component.css']
})
export class RegistarRendaComponent implements OnInit {

  produtores: Produtore[] = [];
  produtor: Produtore;

  chamadas: Chamada[] = [];
  chamada: Chamada;

  municipios: string[] = [];

  servico: ServicosPrestadosModel;

  visita: VisitaPostModel;
  
  //Forms Utilizados no registro
  produtoresForm: FormGroup;
  servicosForm: FormGroup;
  visitaForm: FormGroup;
  tecnicoResponsavel: TecnicoModel;
  
  constructor(
    private fb: FormBuilder,
    private municipioService: SearchMunicipioService,
    private visitaService: VisitaService,
    private messageService: MessageService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) { 
    this.loadMunicipios();

  }

  ngOnInit(): void {
    //Carrega o formulário de produtores
    this.produtorLoadForm();
    //Carrega o formulário de servicos
    this.servicoLoadForm(); 
    //Carrega o formulário de visita
    this.visitaLoadForm();
  }

  private visitaLoadForm() {
    this.visitaForm = new FormGroup({
      createFolder: new FormControl('true', [Validators.required]),
      localDoAtendimeno: new FormControl('', [Validators.required, Validators.minLength(6)]),
      dataDaVisita: new FormControl('', [Validators.required]),
      situacaoAtual: new FormControl('Venda de Bezerros 8@', [Validators.required]),
      orientacao: new FormControl('***'),
      recomendacao: new FormControl('***'),
      municipio: new FormControl('***')
    });
  }

  private servicoLoadForm() {
    this.servicosForm = new FormGroup({
      serviceProvidedCode: new FormControl('', [Validators.required]),
      servicoPrestado: new FormControl('', [Validators.required]),
      ocorrencia: new FormControl(''),
      valor: new FormControl('', [Validators.required])
    });
  }

  private produtorLoadForm() {
    this.produtoresForm = this.fb.group({
      cpf: ['', [Validators.required, CpfValidator]],
      nome: ['', [Validators.required, Validators.minLength(6)]]
    });

  }

  loadMunicipios(){
    const component = this;
    this.municipioService.getMunicipios().subscribe(
      data=>{
        this.municipios = data;
      },
      error=>{
        this.messageService.sendError(this._snackBar, "Erro na API IBGE", JSON.stringify(error.message));
      }
    );
  }

  incluirProdutor(event){
    event.preventDefault();
    const component = this;
    this.produtor = this.produtoresForm.value;
    if(!this.produtores.includes(this.produtor)){
      this.produtores.push(this.produtor);
    }else{

      this.messageService.sendError(this._snackBar, "Erro", "Já existe este elemento!");
    }
    this.produtoresFormClean();
  }
  produtoresFormClean() {
    this.produtor = null;
    this.produtoresForm = this.fb.group({
      cpf: ['', [Validators.required, CpfValidator]],
      nome: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  myFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    return day !== 0 && day !== 6;
  }
  incluirServico(event){
    const component = this;
    event.preventDefault();
    this.chamada = this.servicosForm.value;
    
    if(!this.chamadas.includes(this.chamada)){
      this.chamada.cpfReponsavel = this.tecnicoResponsavel.login;
      this.chamadas.push(this.chamada);
    }else{
      this.messageService.sendError(this._snackBar, "Erro",  "Já existe este serviço!");
    }
    this.servicosFormClean();
  }
  servicosFormClean() {
    this.chamada = null;
    this.servicosForm = new FormGroup({
      serviceProvidedCode: new FormControl('', [Validators.required]),
      servicoPrestado: new FormControl('', [Validators.required]),
      ocorrencia: new FormControl(''),
      valor: new FormControl('', [Validators.required])
    });
  }
  removerChamada(value, event){
    event.preventDefault();
    this.chamadas = this.chamadas.filter(item => item != value);
    
  }
  removerProdutor(value, event){
    event.preventDefault();
    this.produtores = this.produtores.filter(item => item != value);
    
  }
  registrarVisita(){

    //Configurando visita com os dados do form
    /*
    this.visita = new VisitaPostModel(
      this.chamadas,//chamadas: ChamadasPost[],
      this.produtores,//produtores: ProdutoresMin[],
      this.visitaForm['criarPasta'],
      this.visitaForm['dataDaVisita'],
      this.visitaForm['localDoAtendimento'],
      this.visitaForm['situacaoAtual'],
      this.visitaForm['orientacoes'],
      this.visitaForm['recomendaoes'],
      this.visitaForm['municipio']
      );
      */
     this.visita = this.visitaForm.value;
     this.visita.chamadas = this.chamadas;
     this.visita.produtores = this.produtores;
     //console.log("Visita: " + JSON.stringify(this.visita));
     //console.log("localDoAtendimento: " + this.visitaForm['localDoAtendimento']);
     //console.log("dataDaVisita: " + this.visitaForm['dataDaVisita']);
     this.visitaService.sendVisita(this.visita).subscribe(
       data=>{
         this.router.navigate(['login/home']);
         this.messageService.sendInfoMessage(this._snackBar, "Sucesso!", "O Atendimento foi registrado com sucesso")
        },
        error=>{
          this.messageService.sendError(this._snackBar, "Erro", error.error.errors)
        }
      );
  }

  onSelecionaServico(servicoInf) {
    this.servico = servicoInf;
    this.atualizaFormularioServico();
  }

  onSelecionaTecnico(information) {
    this.tecnicoResponsavel = information;
  }

  atualizaFormularioServico() {
    //Atualiza campos do formulário de servicos
    
    this.servicosForm.patchValue({
      serviceProvidedCode: this.servico.codigo,
      servicoPrestado: this.servico.descricao,
      valor: this.servico.defaultValue
    });
  }
}