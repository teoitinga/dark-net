import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { CallData, Content } from '../../models/call-get-list';
import { ChamadaService } from '../../services/chamada.service';

export interface UserData {
  id: string;
  name: string;
  progress: string;
  color: string;
}

/** Constants used to fill up our data base. */
const COLORS: string[] = [
  'maroon', 'red', 'orange', 'yellow', 'olive', 'green', 'purple', 'fuchsia', 'lime', 'teal',
  'aqua', 'blue', 'navy', 'black', 'gray'
];
const NAMES: string[] = [
  'Maia', 'Asher', 'Olivia', 'Atticus', 'Amelia', 'Jack', 'Charlotte', 'Theodore', 'Isla', 'Oliver',
  'Isabella', 'Jasper', 'Cora', 'Levi', 'Violet', 'Arthur', 'Mia', 'Thomas', 'Elizabeth'
];

/**
 * @title Data table with sorting, pagination, and filtering.
 */
  @Component({
    selector: 'app-lista-acoes',
    templateUrl: './lista-acoes.component.html',
    styleUrls: ['./lista-acoes.component.css']
  })
  export class ListaAcoesComponent implements AfterViewInit  {
    displayedColumns: string[] = ['data-previsao', 'id', 'name', 'progress', 'color'];
    //dataSource: MatTableDataSource<UserData>;
    dataSource: MatTableDataSource<Content>;
  
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
  
    callData: CallData;
    
    constructor(
      private callService: ChamadaService
    ) {
      //obtem todas as chamadas
      this.callService.loadCalls().subscribe(
        data=>{
          this.callData = data;
          console.info(this.callData.content);
          this.dataSource = new MatTableDataSource(this.callData.content);
        },
        error=>{
          console.error(error);

        }

      );
      // Create 100 users
      const users = Array.from({length: 100}, (_, k) => createNewUser(k + 1));
  
      // Assign the data to the data source for the table to render
      //this.dataSource = new MatTableDataSource(users);
    }
  
    ngAfterViewInit() {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  
    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
  
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }
  
  /** Builds and returns a new User. */
  function createNewUser(id: number): UserData {
    const name = NAMES[Math.round(Math.random() * (NAMES.length - 1))] + ' ' +
        NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) + '.';
  
    return {
      id: id.toString(),
      name: name,
      progress: Math.round(Math.random() * 100).toString(),
      color: COLORS[Math.round(Math.random() * (COLORS.length - 1))]
    };
  }