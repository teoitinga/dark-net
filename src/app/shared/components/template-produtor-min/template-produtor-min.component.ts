import { Produtore } from './../../../visita/models/visita-post.model';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VisitaService } from 'src/app/visita/services/visita.service';
import { MessageService } from '../../service/responses-messages.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CpfValidator } from '../../validators/cpf-validator';

@Component({
  selector: 'template-produtor-min',
  templateUrl: './template-produtor-min.component.html',
  styleUrls: ['./template-produtor-min.component.css']
})
export class TemplateProdutorMinComponent implements OnInit {
  loading: boolean = false;

  //Forms Utilizados no registro
  produtoresForm: FormGroup;

  produtores: Produtore[] = [];
  produtor: Produtore;

  @Output() updated = new EventEmitter();

  //FIELDS of form
  FIELD_NAME_PRODUTOR: string = 'nome';


  constructor(
    private fb: FormBuilder,
    private visitaService: VisitaService,
    private messageService: MessageService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    //Carrega o formulário de produtores
    this.produtorLoadForm();
  }
  private produtorLoadForm() {
    this.produtoresForm = this.fb.group({
      cpf: ['', [Validators.required, CpfValidator]],
      nome: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(6)]]
    });

  }
  private clearFormProdutor() {
    this.produtoresForm.controls['nome'].disable();
    this.produtoresForm.controls['nome'].setValue('');
    this.produtoresForm.controls['cpf'].setValue('');
  }

  incluirProdutor(event) {
    
    event.preventDefault();
    const prd: Produtore = this.produtoresForm.value;

    //verifica se existe o produtor na lista
    const containing = this.produtores.find(pr => pr == prd);

    if (!containing) {

      this.produtores.push(prd);
      this.clearFormProdutor();

    } else {
      this.messageService.sendError(this._snackBar, "Erro", "Este beneficiário já é atendido!");
    }

    //emitindo notificação para atualização de serviço
    this.updated.emit(this.produtores)
    this.produtoresFormClean();
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
    this.produtores = this.produtores.filter(item => item != value);

  }

  verificarProdutor(value: any) {
    const cpf: string = value.target.value.replace(/\.|\-/g, '');
    let nomeProdutor: string = '';
    this.loading = true;
    this.visitaService.obterProdutor(cpf).subscribe(
      data => {
        nomeProdutor = data['nome'];
        this.produtoresForm.controls['nome'].disable();
        this.produtoresForm.controls['nome'].setValue(nomeProdutor);

        this.produtor = this.produtoresForm.value;

        this.produtor.nome = this.produtoresForm.controls['nome'].value;
        this.loading = !true;
      },
      error => {
        this.habilitaInfoNome()
        this.loading = !true;
      }
    );

  }
  habilitaInfoNome() {
    this.produtoresForm.controls['nome'].enable();
    this.produtoresForm.controls['nome'].setValue('');
    this.produtoresForm.controls['nome'].setValidators([Validators.required, Validators.minLength(6)]);
  }
  produtoresFormClean() {
    this.produtor = null;
    this.produtoresForm = this.fb.group({
      cpf: ['', [Validators.required, CpfValidator]],
      nome: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
}
